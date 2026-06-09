import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Panel } from "@/components/common/Panel";
import { useLifeDeskSnapshot, useLifeDeskStore, getCategoryById, getEventGroups, getEventPendingCount, getPersonById } from "@/store/useLifeDeskStore";
import { eventLabels, sharedCopy, t } from "@/utils/copy";
import type { Task } from "@/types/models";
import { formatShortDate, getTaskEventDate } from "@/utils/date";

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 400;
const CATEGORY_NODE_DIAMETER = 26;
const TASK_NODE_DIAMETER = 18;
const LINK_DISTANCE = 182;
const REPULSION_STRENGTH = 9000;
const SPRING_STRENGTH = 0.014;
const ANCHOR_STRENGTH = 0.018;
const DAMPING = 0.84;
const MAX_VELOCITY = 18;

type CanvasSelection =
  | { type: "category"; id: string }
  | { type: "task"; id: string }
  | null;

type DraggingNode = {
  type: "category" | "task";
  id: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  pointerId: number;
};

type NodePosition = {
  x: number;
  y: number;
};

const categoryToneMap: Record<string, { stroke: string; soft: string; border: string }> = {
  study: {
    stroke: "#60a5fa",
    soft: "rgba(96, 165, 250, 0.14)",
    border: "rgba(96, 165, 250, 0.45)",
  },
  career: {
    stroke: "#f59e0b",
    soft: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.45)",
  },
  life: {
    stroke: "#34d399",
    soft: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.45)",
  },
};

const categoryAnchorMap: Record<string, NodePosition> = {
  study: { x: 118, y: 82 },
  career: { x: 252, y: 190 },
  life: { x: 124, y: 308 },
};

const taskFanPatterns: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 188, y: 0 }],
  2: [
    { x: 176, y: -34 },
    { x: 188, y: 34 },
  ],
  3: [
    { x: 168, y: -48 },
    { x: 194, y: 0 },
    { x: 176, y: 48 },
  ],
  4: [
    { x: 162, y: -66 },
    { x: 194, y: -18 },
    { x: 194, y: 22 },
    { x: 168, y: 70 },
  ],
};

function mergeNodePositions(current: Record<string, NodePosition>, defaults: Record<string, NodePosition>) {
  const next = Object.fromEntries(
    Object.entries(defaults).map(([id, position]) => [id, current[id] ?? position]),
  );

  const currentEntries = Object.entries(current);
  const nextEntries = Object.entries(next);

  if (
    currentEntries.length === nextEntries.length
    && nextEntries.every(([id, position]) => current[id]?.x === position.x && current[id]?.y === position.y)
  ) {
    return current;
  }

  return next;
}

function clampPosition(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function pruneVelocityMap(current: Record<string, NodePosition>, ids: string[]) {
  return Object.fromEntries(
    ids.map((id) => [id, current[id] ?? { x: 0, y: 0 }]),
  );
}

function getDefaultCategoryAnchor(groupId: string, index: number, total: number) {
  const mapped = categoryAnchorMap[groupId];
  if (mapped) {
    return mapped;
  }

  return {
    x: 128 + (index % 2) * 92,
    y: 72 + (index / Math.max(total, 1)) * 248,
  };
}

function getTaskOffsets(total: number) {
  if (taskFanPatterns[total]) {
    return taskFanPatterns[total];
  }

  return Array.from({ length: total }, (_, index) => ({
    x: 172 + (index % 2) * 22 + Math.floor(index / 4) * 20,
    y: (index - (total - 1) / 2) * 34,
  }));
}

function buildDefaultTaskPositions(tasks: Task[], categoryPositions: Record<string, NodePosition>) {
  const tasksByCategory = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const groupedTasks = tasksByCategory.get(task.categoryId) ?? [];
    groupedTasks.push(task);
    tasksByCategory.set(task.categoryId, groupedTasks);
  });

  return Object.fromEntries(
    tasks.flatMap((task) => {
      const groupedTasks = tasksByCategory.get(task.categoryId) ?? [task];
      const taskIndex = groupedTasks.findIndex((groupedTask) => groupedTask.id === task.id);
      const categoryPosition = categoryPositions[task.categoryId] ?? { x: 146, y: 180 };
      const offsets = getTaskOffsets(groupedTasks.length);
      const offset = offsets[Math.max(taskIndex, 0)] ?? offsets[offsets.length - 1] ?? { x: 188, y: 0 };

      return [[
        task.id,
        {
          x: categoryPosition.x + offset.x,
          y: categoryPosition.y + offset.y,
        },
      ]];
    }),
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const language = useLifeDeskStore((state) => state.settings.language);
  const createTask = useLifeDeskStore((state) => state.createTask);
  const completeTask = useLifeDeskStore((state) => state.completeTask);
  const snapshot = useLifeDeskSnapshot();
  const eventGroups = useMemo(() => getEventGroups(snapshot), [snapshot]);
  const recentTasks = useMemo(
    () =>
      snapshot.tasks
        .filter((task) => task.status === "pending" && !task.isDeleted)
        .sort((left, right) => {
          const leftDate = getTaskEventDate(left);
          const rightDate = getTaskEventDate(right);

          if (leftDate && rightDate) {
            return new Date(leftDate).getTime() - new Date(rightDate).getTime();
          }

          if (leftDate) {
            return -1;
          }

          if (rightDate) {
            return 1;
          }

          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        }),
    [snapshot.tasks],
  );
  const canvasTasks = useMemo(() => recentTasks.slice(0, 6), [recentTasks]);
  const canvasRootRef = useRef<HTMLDivElement | null>(null);
  const categoryPositionsRef = useRef<Record<string, NodePosition>>({});
  const taskPositionsRef = useRef<Record<string, NodePosition>>({});
  const draggingNodeRef = useRef<DraggingNode | null>(null);
  const velocityRef = useRef<{
    category: Record<string, NodePosition>;
    task: Record<string, NodePosition>;
  }>({
    category: {},
    task: {},
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("study");
  const [personId, setPersonId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CanvasSelection>(null);
  const [draggingNode, setDraggingNode] = useState<DraggingNode | null>(null);
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);
  const defaultCategoryPositions = useMemo(
    () =>
      Object.fromEntries(
        eventGroups.map((group, index) => [
          group.id,
          getDefaultCategoryAnchor(group.id, index, eventGroups.length),
        ]),
      ),
    [eventGroups],
  );
  const defaultTaskPositions = useMemo(
    () => buildDefaultTaskPositions(canvasTasks, defaultCategoryPositions),
    [canvasTasks, defaultCategoryPositions],
  );
  const [categoryPositions, setCategoryPositions] = useState<Record<string, NodePosition>>(defaultCategoryPositions);
  const [taskPositions, setTaskPositions] = useState<Record<string, NodePosition>>(defaultTaskPositions);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId("study");
    setPersonId("");
    setDueAt("");
  };

  const handleCreateTask = async () => {
    if (!title.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskId = await createTask({
        categoryId,
        personId: personId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });

      if (!taskId) {
        return;
      }

      resetForm();
      setIsCreateOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setCategoryPositions((current) => mergeNodePositions(current, defaultCategoryPositions));
    velocityRef.current.category = pruneVelocityMap(velocityRef.current.category, eventGroups.map((group) => group.id));
  }, [defaultCategoryPositions]);

  useEffect(() => {
    setTaskPositions((current) => mergeNodePositions(current, defaultTaskPositions));
    velocityRef.current.task = pruneVelocityMap(velocityRef.current.task, canvasTasks.map((task) => task.id));
  }, [defaultTaskPositions]);

  useEffect(() => {
    categoryPositionsRef.current = categoryPositions;
  }, [categoryPositions]);

  useEffect(() => {
    taskPositionsRef.current = taskPositions;
  }, [taskPositions]);

  useEffect(() => {
    draggingNodeRef.current = draggingNode;
  }, [draggingNode]);

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    if (selectedNode.type === "category" && !eventGroups.some((group) => group.id === selectedNode.id)) {
      setSelectedNode(null);
      return;
    }

    if (selectedNode.type === "task" && !canvasTasks.some((task) => task.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [canvasTasks, eventGroups, selectedNode]);

  const categoryNodePositions = eventGroups.map((group) => ({
    ...group,
    ...(categoryPositions[group.id] ?? defaultCategoryPositions[group.id]),
  }));

  const taskNodePositions = canvasTasks.map((task) => ({
    ...task,
    ...(taskPositions[task.id] ?? defaultTaskPositions[task.id]),
  }));

  const selectedTask = selectedNode?.type === "task" ? canvasTasks.find((task) => task.id === selectedNode.id) : undefined;
  const highlightedCategoryId = selectedNode?.type === "category" ? selectedNode.id : selectedTask?.categoryId;
  const isCategoryHighlighted = (groupId: string) =>
    !selectedNode || highlightedCategoryId === groupId;

  const isTaskHighlighted = (task: Task) => {
    if (!selectedNode) {
      return true;
    }

    if (selectedNode.type === "category") {
      return task.categoryId === selectedNode.id;
    }

    return task.id === selectedNode.id;
  };

  const isNodeEmphasized = (nodeKey: string, highlighted: boolean) => {
    if (!selectedNode) {
      return hoveredNodeKey ? hoveredNodeKey === nodeKey : true;
    }

    return highlighted || hoveredNodeKey === nodeKey;
  };

  const startDragging = (
    event: React.PointerEvent<HTMLButtonElement>,
    node: { type: "category" | "task"; id: string; width: number; height: number; position: NodePosition },
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const canvasRect = canvasRootRef.current?.getBoundingClientRect();
    if (!canvasRect) {
      return;
    }

    setDraggingNode({
      type: node.type,
      id: node.id,
      width: node.width,
      height: node.height,
      offsetX: event.clientX - canvasRect.left - node.position.x,
      offsetY: event.clientY - canvasRect.top - node.position.y,
      pointerId: event.pointerId,
    });
  };

  const updateDraggedNodePosition = (clientX: number, clientY: number, currentDragging: DraggingNode) => {
    if (!canvasRootRef.current) {
      return;
    }

    const canvasRect = canvasRootRef.current.getBoundingClientRect();
    const nextPosition = {
      x: clampPosition(clientX - canvasRect.left - currentDragging.offsetX, 12, CANVAS_WIDTH - currentDragging.width - 12),
      y: clampPosition(clientY - canvasRect.top - currentDragging.offsetY, 12, CANVAS_HEIGHT - currentDragging.height - 12),
    };

    if (currentDragging.type === "category") {
      categoryPositionsRef.current = {
        ...categoryPositionsRef.current,
        [currentDragging.id]: nextPosition,
      };
      setCategoryPositions(categoryPositionsRef.current);
      return;
    }

    taskPositionsRef.current = {
      ...taskPositionsRef.current,
      [currentDragging.id]: nextPosition,
    };
    setTaskPositions(taskPositionsRef.current);
  };

  const stopDragging = () => {
    setDraggingNode(null);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingNode) {
      return;
    }

    updateDraggedNodePosition(event.clientX, event.clientY, draggingNode);
  };

  useEffect(() => {
    if (!draggingNode) {
      return;
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== draggingNode.pointerId) {
        return;
      }

      updateDraggedNodePosition(event.clientX, event.clientY, draggingNode);
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== draggingNode.pointerId) {
        return;
      }

      stopDragging();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [draggingNode]);

  useEffect(() => {
    if (eventGroups.length === 0) {
      return;
    }

    let frameId = 0;
    let lastTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 16.67, 1.8);
      lastTimestamp = timestamp;

      const nextCategoryPositions = { ...categoryPositionsRef.current };
      const nextTaskPositions = { ...taskPositionsRef.current };
      const categoryVelocity = { ...velocityRef.current.category };
      const taskVelocity = { ...velocityRef.current.task };
      const dragging = draggingNodeRef.current;

      const categoryNodes = eventGroups.map((group) => ({
        type: "category" as const,
        id: group.id,
        diameter: CATEGORY_NODE_DIAMETER,
        position: nextCategoryPositions[group.id] ?? defaultCategoryPositions[group.id],
        anchor: defaultCategoryPositions[group.id],
      }));
      const taskNodes = canvasTasks.map((task) => ({
        type: "task" as const,
        id: task.id,
        categoryId: task.categoryId,
        diameter: TASK_NODE_DIAMETER,
        position: nextTaskPositions[task.id] ?? defaultTaskPositions[task.id],
        anchor: defaultTaskPositions[task.id],
      }));

      const forceMap: Record<string, NodePosition> = {};
      [...categoryNodes, ...taskNodes].forEach((node) => {
        forceMap[`${node.type}:${node.id}`] = { x: 0, y: 0 };
      });

      const allNodes = [...categoryNodes, ...taskNodes];

      for (let index = 0; index < allNodes.length; index += 1) {
        for (let compareIndex = index + 1; compareIndex < allNodes.length; compareIndex += 1) {
          const first = allNodes[index];
          const second = allNodes[compareIndex];
          const firstCenterX = first.position.x + first.diameter / 2;
          const firstCenterY = first.position.y + first.diameter / 2;
          const secondCenterX = second.position.x + second.diameter / 2;
          const secondCenterY = second.position.y + second.diameter / 2;
          const dx = secondCenterX - firstCenterX;
          const dy = secondCenterY - firstCenterY;
          const distance = Math.max(Math.hypot(dx, dy), 1);
          const force = REPULSION_STRENGTH / (distance * distance);
          const unitX = dx / distance;
          const unitY = dy / distance;

          forceMap[`${first.type}:${first.id}`].x -= unitX * force;
          forceMap[`${first.type}:${first.id}`].y -= unitY * force;
          forceMap[`${second.type}:${second.id}`].x += unitX * force;
          forceMap[`${second.type}:${second.id}`].y += unitY * force;
        }
      }

      taskNodes.forEach((task) => {
        const category = categoryNodes.find((group) => group.id === task.categoryId);
        if (!category) {
          return;
        }

        const categoryCenterX = category.position.x + category.diameter / 2;
        const categoryCenterY = category.position.y + category.diameter / 2;
        const taskCenterX = task.position.x + task.diameter / 2;
        const taskCenterY = task.position.y + task.diameter / 2;
        const dx = taskCenterX - categoryCenterX;
        const dy = taskCenterY - categoryCenterY;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const stretch = distance - LINK_DISTANCE;
        const pull = stretch * SPRING_STRENGTH;
        const unitX = dx / distance;
        const unitY = dy / distance;

        forceMap[`category:${category.id}`].x += unitX * pull;
        forceMap[`category:${category.id}`].y += unitY * pull;
        forceMap[`task:${task.id}`].x -= unitX * pull;
        forceMap[`task:${task.id}`].y -= unitY * pull;
      });

      categoryNodes.forEach((node) => {
        const key = `category:${node.id}`;
        forceMap[key].x += (node.anchor.x - node.position.x) * ANCHOR_STRENGTH;
        forceMap[key].y += (node.anchor.y - node.position.y) * ANCHOR_STRENGTH;
      });

      taskNodes.forEach((node) => {
        const key = `task:${node.id}`;
        forceMap[key].x += (node.anchor.x - node.position.x) * ANCHOR_STRENGTH;
        forceMap[key].y += (node.anchor.y - node.position.y) * ANCHOR_STRENGTH;
      });

      categoryNodes.forEach((node) => {
        const key = `category:${node.id}`;
        if (dragging?.type === "category" && dragging.id === node.id) {
          categoryVelocity[node.id] = { x: 0, y: 0 };
          return;
        }

        const velocity = categoryVelocity[node.id] ?? { x: 0, y: 0 };
        let nextVelocityX = (velocity.x + forceMap[key].x * delta) * DAMPING;
        let nextVelocityY = (velocity.y + forceMap[key].y * delta) * DAMPING;
        nextVelocityX = clampPosition(nextVelocityX, -MAX_VELOCITY, MAX_VELOCITY);
        nextVelocityY = clampPosition(nextVelocityY, -MAX_VELOCITY, MAX_VELOCITY);
        categoryVelocity[node.id] = { x: nextVelocityX, y: nextVelocityY };
        nextCategoryPositions[node.id] = {
          x: clampPosition(node.position.x + nextVelocityX * delta, 12, CANVAS_WIDTH - CATEGORY_NODE_DIAMETER - 12),
          y: clampPosition(node.position.y + nextVelocityY * delta, 12, CANVAS_HEIGHT - CATEGORY_NODE_DIAMETER - 12),
        };
      });

      taskNodes.forEach((node) => {
        const key = `task:${node.id}`;
        if (dragging?.type === "task" && dragging.id === node.id) {
          taskVelocity[node.id] = { x: 0, y: 0 };
          return;
        }

        const velocity = taskVelocity[node.id] ?? { x: 0, y: 0 };
        let nextVelocityX = (velocity.x + forceMap[key].x * delta) * DAMPING;
        let nextVelocityY = (velocity.y + forceMap[key].y * delta) * DAMPING;
        nextVelocityX = clampPosition(nextVelocityX, -MAX_VELOCITY, MAX_VELOCITY);
        nextVelocityY = clampPosition(nextVelocityY, -MAX_VELOCITY, MAX_VELOCITY);
        taskVelocity[node.id] = { x: nextVelocityX, y: nextVelocityY };
        nextTaskPositions[node.id] = {
          x: clampPosition(node.position.x + nextVelocityX * delta, 12, CANVAS_WIDTH - TASK_NODE_DIAMETER - 12),
          y: clampPosition(node.position.y + nextVelocityY * delta, 12, CANVAS_HEIGHT - TASK_NODE_DIAMETER - 12),
        };
      });

      velocityRef.current = {
        category: categoryVelocity,
        task: taskVelocity,
      };
      categoryPositionsRef.current = nextCategoryPositions;
      taskPositionsRef.current = nextTaskPositions;
      setCategoryPositions(nextCategoryPositions);
      setTaskPositions(nextTaskPositions);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [canvasTasks, defaultCategoryPositions, defaultTaskPositions, eventGroups]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto">
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Panel
          title={language === "zh-CN" ? "事件工作台" : "Events Desk"}
          subtitle={language === "zh-CN" ? "所有事情都在这里汇总，人际事项也只是其中一种关联。" : "This is the single event pool, including tasks linked to people."}
          className="relative overflow-hidden"
          actions={
            <button
              type="button"
              onClick={() => setIsCreateOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
            >
              <Plus className="h-4 w-4" />
              {language === "zh-CN" ? "新增事件" : "Add Event"}
            </button>
          }
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,var(--accent-soft),transparent_60%)] opacity-80" />
          <div className="relative space-y-4">
            {isCreateOpen ? (
              <div className="rounded-[24px] border border-[color:var(--accent-border)] bg-[color:var(--panel-muted)] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "事件标题" : "Event title"}</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={language === "zh-CN" ? "例如：整理周报、预约洗牙" : "For example: Weekly report, dentist appointment"}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "分类" : "Category"}</span>
                    <select
                      value={categoryId}
                      onChange={(event) => setCategoryId(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    >
                      {eventGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {t(language, eventLabels[group.id])}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "关联人物" : "Related person"}</span>
                    <select
                      value={personId}
                      onChange={(event) => setPersonId(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    >
                      <option value="">{language === "zh-CN" ? "不关联人物" : "No person linked"}</option>
                      {snapshot.persons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "说明" : "Description"}</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={3}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{language === "zh-CN" ? "截止时间" : "Due time"}</span>
                    <input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(event) => setDueAt(event.target.value)}
                      className="rounded-[18px] border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-4 py-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-border)]"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateTask()}
                    disabled={isSubmitting}
                    className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-shadow)]"
                  >
                    {isSubmitting ? (language === "zh-CN" ? "保存中..." : "Saving...") : language === "zh-CN" ? "保存事件" : "Save Event"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(false);
                    }}
                    className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--canvas)] px-5 py-3 text-sm font-semibold text-[color:var(--text-strong)]"
                  >
                    {language === "zh-CN" ? "取消" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              {eventGroups.map((group) => (
                <Link
                  key={group.id}
                  to={`/events/${group.id}`}
                  className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 transition hover:-translate-y-1 hover:border-[color:var(--accent-border)]"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">{language === "zh-CN" ? "分类" : "Category"}</p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-[color:var(--text-strong)]">{t(language, eventLabels[group.id])}</h3>
                      <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                        {getEventPendingCount(snapshot, group.id)} {t(language, sharedCopy.totalPending)}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[color:var(--accent)]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title={language === "zh-CN" ? "事件关系画布" : "Event Canvas"}
          subtitle={
            language === "zh-CN"
              ? "参考 Obsidian Canvas，并加入轻微排斥、吸附和回弹，让节点之间更有物理作用感。"
              : "Inspired by Obsidian Canvas, now with subtle repulsion, attraction, and rebound."
          }
          actions={
            selectedNode ? (
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="rounded-full border border-[color:var(--border-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--text-strong)]"
              >
                {language === "zh-CN" ? "取消高亮" : "Clear Focus"}
              </button>
            ) : null
          }
        >
          {taskNodePositions.length > 0 ? (
            <div
              className="overflow-auto rounded-[28px] border border-[color:var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),var(--panel-muted)]"
              style={{ height: `${CANVAS_HEIGHT}px` }}
            >
              <div
                ref={canvasRootRef}
                data-canvas-root="true"
                className="relative"
                style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={stopDragging}
                onPointerLeave={stopDragging}
              >
                <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,var(--border-soft)_1px,transparent_0)] [background-size:24px_24px]" />
                <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
                  {taskNodePositions.map((task) => {
                    const categoryNode = categoryNodePositions.find((group) => group.id === task.categoryId);

                    if (!categoryNode) {
                      return null;
                    }

                    const tone = categoryToneMap[task.categoryId] ?? categoryToneMap.life;
                    const highlighted = isTaskHighlighted(task);

                    return (
                      <line
                        key={`line-${task.id}`}
                        x1={categoryNode.x + CATEGORY_NODE_DIAMETER / 2}
                        y1={categoryNode.y + CATEGORY_NODE_DIAMETER / 2}
                        x2={task.x + TASK_NODE_DIAMETER / 2}
                        y2={task.y + TASK_NODE_DIAMETER / 2}
                        stroke={tone.stroke}
                        strokeOpacity={highlighted ? 0.72 : 0.18}
                        strokeWidth={highlighted ? 2.8 : 1.4}
                      />
                    );
                  })}
                </svg>

                {categoryNodePositions.map((group) => {
                  const tone = categoryToneMap[group.id] ?? categoryToneMap.life;
                  const highlighted = isCategoryHighlighted(group.id);
                  const nodeKey = `category:${group.id}`;
                  const emphasized = isNodeEmphasized(nodeKey, highlighted);

                  return (
                    <div
                      key={group.id}
                      className="absolute"
                      style={{
                        left: `${group.x}px`,
                        top: `${group.y}px`,
                      }}
                      onMouseEnter={() => setHoveredNodeKey(nodeKey)}
                      onMouseLeave={() => setHoveredNodeKey((current) => (current === nodeKey ? null : current))}
                    >
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+12px)] whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur transition"
                        style={{
                          borderColor: emphasized ? tone.border : "var(--border-soft)",
                          backgroundColor: highlighted ? tone.soft : "rgba(255,255,255,0.92)",
                          color: "var(--text-strong)",
                          opacity: selectedNode && !highlighted && hoveredNodeKey !== nodeKey ? 0.38 : 1,
                          transform: emphasized ? "translate(-50%, calc(-100% - 12px)) scale(1.03)" : "translate(-50%, calc(-100% - 12px)) scale(1)",
                        }}
                      >
                        {t(language, eventLabels[group.id])}
                      </div>
                      <button
                        type="button"
                        aria-label={t(language, eventLabels[group.id])}
                        title={language === "zh-CN" ? "单击高亮，双击打开分类" : "Click to focus, double-click to open"}
                        onPointerDown={(event) =>
                          startDragging(event, {
                            type: "category",
                            id: group.id,
                            width: CATEGORY_NODE_DIAMETER,
                            height: CATEGORY_NODE_DIAMETER,
                            position: { x: group.x, y: group.y },
                          })
                        }
                        onClick={() =>
                          setSelectedNode((current) =>
                            current?.type === "category" && current.id === group.id ? null : { type: "category", id: group.id },
                          )
                        }
                        onDoubleClick={() => navigate(`/events/${group.id}`)}
                        className="rounded-full border shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition active:cursor-grabbing"
                        style={{
                          width: `${CATEGORY_NODE_DIAMETER}px`,
                          height: `${CATEGORY_NODE_DIAMETER}px`,
                          borderColor: emphasized ? tone.border : "rgba(255,255,255,0.65)",
                          backgroundColor: tone.stroke,
                          boxShadow: emphasized ? `0 0 0 6px ${tone.soft}, 0 0 30px ${tone.soft}` : `0 0 0 4px ${tone.soft}`,
                          cursor: draggingNode?.type === "category" && draggingNode.id === group.id ? "grabbing" : "grab",
                          opacity: selectedNode && !highlighted && hoveredNodeKey !== nodeKey ? 0.38 : 1,
                        }}
                      />
                    </div>
                  );
                })}

                {taskNodePositions.map((task) => {
                  const tone = categoryToneMap[task.categoryId] ?? categoryToneMap.life;
                  const highlighted = isTaskHighlighted(task);
                  const nodeKey = `task:${task.id}`;
                  const emphasized = isNodeEmphasized(nodeKey, highlighted);

                  return (
                    <div
                      key={task.id}
                      className="absolute"
                      style={{
                        left: `${task.x}px`,
                        top: `${task.y}px`,
                      }}
                      onMouseEnter={() => setHoveredNodeKey(nodeKey)}
                      onMouseLeave={() => setHoveredNodeKey((current) => (current === nodeKey ? null : current))}
                    >
                      <div
                        className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur transition"
                        style={{
                          borderColor: emphasized ? tone.border : "var(--border-soft)",
                          backgroundColor: highlighted ? tone.soft : "rgba(255,255,255,0.92)",
                          color: "var(--text-strong)",
                          opacity: selectedNode && !highlighted && hoveredNodeKey !== nodeKey ? 0.34 : 1,
                          transform: emphasized ? "translate(-50%, calc(-100% - 14px)) scale(1.03)" : "translate(-50%, calc(-100% - 14px)) scale(1)",
                        }}
                      >
                        <span>{task.title}</span>
                        <span className="ml-2 text-[10px] text-[color:var(--text-soft)]">
                          {formatShortDate(getTaskEventDate(task), language)}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={task.title}
                        title={
                          task.personId
                            ? `${task.title} · ${language === "zh-CN" ? "人物" : "Person"}：${getPersonById(snapshot, task.personId)?.name || task.personId}`
                            : task.title
                        }
                        onPointerDown={(event) =>
                          startDragging(event, {
                            type: "task",
                            id: task.id,
                            width: TASK_NODE_DIAMETER,
                            height: TASK_NODE_DIAMETER,
                            position: { x: task.x, y: task.y },
                          })
                        }
                        onClick={() =>
                          setSelectedNode((current) =>
                            current?.type === "task" && current.id === task.id ? null : { type: "task", id: task.id },
                          )
                        }
                        onDoubleClick={() => navigate(`/events/task/${task.id}`)}
                        className="rounded-full border transition active:cursor-grabbing"
                        style={{
                          width: `${TASK_NODE_DIAMETER}px`,
                          height: `${TASK_NODE_DIAMETER}px`,
                          borderColor: emphasized ? tone.border : "rgba(255,255,255,0.65)",
                          backgroundColor: tone.stroke,
                          boxShadow: emphasized ? `0 0 0 5px ${tone.soft}, 0 0 24px ${tone.soft}` : `0 0 0 3px ${tone.soft}`,
                          cursor: draggingNode?.type === "task" && draggingNode.id === task.id ? "grabbing" : "grab",
                          opacity: selectedNode && !highlighted && hoveredNodeKey !== nodeKey ? 0.34 : 1,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] px-5 py-10 text-sm text-[color:var(--text-soft)]">
              {language === "zh-CN" ? "还没有近期事件，先新增几个事件后，这里会自动生成关系画布。" : "No recent tasks yet. Create a few tasks and the canvas will appear here."}
            </div>
          )}
        </Panel>
      </section>

      <Panel
        title={language === "zh-CN" ? "近期事件" : "Recent Events"}
        subtitle={
          language === "zh-CN"
            ? "保留这一份近期视图；有时间就按时间排序，没有时间就按最近改动排序。"
            : "A single recent view: timed tasks sort by date, untimed tasks fall back to recent updates."
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {recentTasks.map((task) => (
            <div key={task.id} className="rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-strong)]">{task.title}</p>
                    <p className="mt-1 text-xs text-[color:var(--text-soft)]">
                      {(task.categoryId in eventLabels ? t(language, eventLabels[task.categoryId]) : getCategoryById(snapshot, task.categoryId)?.name || task.categoryId)}
                      {task.personId ? ` · ${language === "zh-CN" ? "人物" : "Person"}：${getPersonById(snapshot, task.personId)?.name || task.personId}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void completeTask(task.id)}
                  className="rounded-full bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--accent-shadow)]"
                >
                  {language === "zh-CN" ? "点掉" : "Done"}
                </button>
              </div>
              <p className="mt-3 text-xs text-[color:var(--text-soft)]">{formatShortDate(getTaskEventDate(task), language)}</p>
            </div>
          ))}
          {recentTasks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border-soft)] bg-[color:var(--panel-muted)] p-5 text-sm text-[color:var(--text-soft)]">
              {language === "zh-CN" ? "当前没有待处理事件，先在上面新增一个事件。" : "No pending tasks yet. Create one from the panel above."}
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
