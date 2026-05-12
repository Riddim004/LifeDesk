import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import SocialPage from "@/pages/SocialPage";
import { createDemoState, resetDemoState, useLifeDeskStore, getPendingCountByRelation, getPeopleByRelation } from "@/store/useLifeDeskStore";

describe("人际模块主视图", () => {
  beforeEach(() => {
    localStorage.clear();
    useLifeDeskStore.setState(createDemoState());
  });

  afterEach(() => {
    resetDemoState();
  });

  it("默认以人物为主导展示需要处理的人，而不是直接平铺事务", () => {
    render(
      <MemoryRouter>
        <SocialPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("人际看板")).toBeInTheDocument();
    expect(screen.getAllByText("妈妈").length).toBeGreaterThan(0);
    expect(screen.getByText(/最近待办：买生日礼物|最近待办：提醒买生日蛋糕/)).toBeInTheDocument();
  });

  it("完成人物事务后，分类红点计数会递减", () => {
    const before = getPendingCountByRelation(useLifeDeskStore.getState(), "family");
    useLifeDeskStore.getState().completeTask("t-mom-1");
    const after = getPendingCountByRelation(useLifeDeskStore.getState(), "family");

    expect(after).toBe(before - 1);
  });

  it("点击新增人物后会打开表单，并允许创建新人物", () => {
    render(
      <MemoryRouter>
        <SocialPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "新增人物" })[0]);

    expect(screen.getByText("人物名称")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("人物名称"), { target: { value: "表姐" } });
    fireEvent.change(screen.getByLabelText("关系分类"), { target: { value: "family" } });
    fireEvent.click(screen.getByRole("button", { name: "保存并进入" }));

    const people = getPeopleByRelation(useLifeDeskStore.getState(), "family");
    expect(people.some((person) => person.name === "表姐")).toBe(true);
  });

  it("重置演示数据后会恢复默认的人际统计", () => {
    useLifeDeskStore.getState().createPerson({
      categoryId: "family",
      name: "联调人物",
    });
    useLifeDeskStore.getState().completeTask("t-dad-1");

    useLifeDeskStore.getState().resetDemo();

    expect(getPeopleByRelation(useLifeDeskStore.getState(), "family").some((person) => person.name === "联调人物")).toBe(false);
    expect(getPendingCountByRelation(useLifeDeskStore.getState(), "family")).toBe(3);
  });
});
