import { LuHouse, LuLayoutGrid, LuChartBar, LuBell } from "react-icons/lu";

export const boardNavItems = [
  { href: "/", icon: LuHouse, key: "home", active: true },
  { href: "/board", icon: LuLayoutGrid, key: "board", active: true },
  { href: "/market", icon: LuChartBar, key: "market", active: false },
  { href: "/alerts", icon: LuBell, key: "alerts", active: false },
] as const;