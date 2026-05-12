import { useEffect } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import CalendarDayPage from "@/pages/CalendarDayPage";
import CalendarPage from "@/pages/CalendarPage";
import EventCategoryPage from "@/pages/EventCategoryPage";
import EventTaskPage from "@/pages/EventTaskPage";
import EventsPage from "@/pages/EventsPage";
import MoneyPage from "@/pages/MoneyPage";
import MoneyRecordPage from "@/pages/MoneyRecordPage";
import PersonPage from "@/pages/PersonPage";
import SettingsPage from "@/pages/SettingsPage";
import SocialPage from "@/pages/SocialPage";
import SocialRelationPage from "@/pages/SocialRelationPage";
import { useLifeDeskStore } from "@/store/useLifeDeskStore";

export default function App() {
  const settings = useLifeDeskStore((state) => state.settings);
  const initialize = useLifeDeskStore((state) => state.initialize);

  useEffect(() => {
    document.documentElement.dataset.themeMode = settings.themeMode;
    document.documentElement.dataset.themeColor = settings.themeColor;
    document.documentElement.dataset.fontSize = settings.fontSize;
    document.documentElement.lang = settings.language;
    document.title = settings.language === "zh-CN" ? "LifeDesk | 人生事务台" : "LifeDesk | Personal Life Desk";
  }, [settings.fontSize, settings.language, settings.themeColor, settings.themeMode]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:categoryId" element={<EventCategoryPage />} />
          <Route path="/events/task/:taskId" element={<EventTaskPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/social/:relationId" element={<SocialRelationPage />} />
          <Route path="/social/person/:personId" element={<PersonPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/money/:recordId" element={<MoneyRecordPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar/:date" element={<CalendarDayPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
