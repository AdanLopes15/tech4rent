import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Smartphone, 
  Terminal, 
  MapPin, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
      isActive 
        ? "bg-orange-500 text-white shadow-md shadow-orange-200" 
        : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
    )}
  >
    <Icon size={20} className={cn("transition-transform group-hover:scale-110")} />
    <span className="font-medium flex-1">{label}</span>
    <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
  </NavLink>
);

export const MDMSidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 shadow-sm z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-100">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Tech4Rent</h1>
            <p className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">MDM Panel</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarItem to="/mdm/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/mdm/devices" icon={Smartphone} label="Dispositivos" />
          <SidebarItem to="/mdm/commands" icon={Terminal} label="Comandos" />
          <SidebarItem to="/mdm/locations" icon={MapPin} label="Localizações" />
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <button 
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          onClick={() => window.location.href = '/'}
        >
          <LogOut size={20} />
          <span className="font-medium text-left">Sair</span>
        </button>
      </div>
    </aside>
  );
};
