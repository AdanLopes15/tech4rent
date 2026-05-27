import React from "react";
import { Outlet } from "react-router-dom";
import { MDMSidebar } from "./Sidebar";

export const MDMLayout = () => {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <MDMSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
