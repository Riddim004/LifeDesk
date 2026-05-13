import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EventCategoryPage from "@/pages/EventCategoryPage";
import EventsPage from "@/pages/EventsPage";
import { createDemoState, resetDemoState, useLifeDeskStore, getTaskById, getTasksByEventCategory } from "@/store/useLifeDeskStore";

describe("事件模块编辑能力", () => {
  beforeEach(() => {
    localStorage.clear();
    useLifeDeskStore.setState(createDemoState());
  });

  afterEach(() => {
    resetDemoState();
  });

  it("事件分类页会给已有事件提供点进编辑的入口", () => {
    render(
      <MemoryRouter initialEntries={["/events/study"]}>
        <Routes>
          <Route path="/events/:categoryId" element={<EventCategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("点进来编辑这个事件").length).toBeGreaterThan(0);
  });

  it("关联到人物的事项也会出现在对应事件分类里", () => {
    render(
      <MemoryRouter initialEntries={["/events/career"]}>
        <Routes>
          <Route path="/events/:categoryId" element={<EventCategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("发合作资料")).toBeInTheDocument();
    expect(screen.getByText("关联人物：阿杰")).toBeInTheDocument();
  });

  it("允许更新已有事件的标题和状态", () => {
    useLifeDeskStore.getState().updateTask("t-study-1", {
      title: "新的英语考试计划",
      status: "completed",
    });

    const task = getTaskById(useLifeDeskStore.getState(), "t-study-1");

    expect(task?.title).toBe("新的英语考试计划");
    expect(task?.status).toBe("completed");
    expect(task?.isDeleted).toBe(false);
  });

  it("支持在事件工作台直接新建事件", () => {
    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增事件" }));
    fireEvent.change(screen.getByLabelText("事件标题"), { target: { value: "补做实验报告" } });
    fireEvent.change(screen.getByLabelText("分类"), { target: { value: "study" } });
    fireEvent.click(screen.getByRole("button", { name: "保存事件" }));

    const studyTasks = getTasksByEventCategory(useLifeDeskStore.getState(), "study");
    expect(studyTasks.some((task) => task.title === "补做实验报告")).toBe(true);
  });

  it("支持在事件分类页快速点掉已有事件", () => {
    render(
      <MemoryRouter initialEntries={["/events/study"]}>
        <Routes>
          <Route path="/events/:categoryId" element={<EventCategoryPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "点掉" })[0]);

    const task = getTaskById(useLifeDeskStore.getState(), "t-study-1");
    expect(task?.status).toBe("completed");
    expect(task?.isDeleted).toBe(true);
  });
});
