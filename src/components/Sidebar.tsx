import { useState } from 'react'
import {
    LayoutDashboard,
    Users,
    AlertTriangle,
    Settings,
    DollarSign,
    LogOut,
    Building2,
    Package,
    CalendarDays,
    Clock,
    TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Badge } from './ui/badge'

interface SidebarProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    isAdmin: boolean
    isSuperAdmin: boolean
    onSignOut: () => void
    logoUrl?: string | null
}

export function Sidebar({
    activeTab,
    setActiveTab,
    isAdmin,
    isSuperAdmin,
    onSignOut,
    logoUrl
}: SidebarProps) {
    const [isHovered, setIsHovered] = useState(false)
    const { unreadCount } = useUnreadMessages()

    const menuItems = [
        { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard, show: true },
        { id: 'activity', label: 'Activité Directe', icon: Clock, show: true, badge: unreadCount > 0 ? unreadCount : null },
        { id: 'users', label: 'Collaborateurs', icon: Users, show: isAdmin },
        { id: 'payments', label: 'Paiements', icon: DollarSign, show: true },
        { id: 'evolution', label: 'Mon Évolution', icon: TrendingUp, show: true },
        { id: 'schedules', label: 'Plannings', icon: CalendarDays, show: isAdmin },
        { id: 'absences', label: 'Demandes', icon: AlertTriangle, show: isAdmin },
        { id: 'prestations', label: 'Services', icon: Package, show: isAdmin },
        { id: 'settings', label: 'Configuration', icon: Settings, show: isSuperAdmin },
    ]

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 shadow-2xl",
                isHovered ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col h-full py-6">
                {/* Logo Section */}
                <div className="px-4 mb-10 flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="w-7 h-7 text-white" />
                        )}
                    </div>
                    <div className={cn(
                        "transition-opacity duration-300 whitespace-nowrap",
                        isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Enixis HR
                        </h1>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 space-y-2 overflow-y-auto scrollbar-hide">
                    {menuItems.filter(item => item.show).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative",
                                activeTab === item.id
                                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className="relative">
                                <item.icon className={cn(
                                    "w-6 h-6 shrink-0 transition-transform duration-200",
                                    activeTab === item.id ? "scale-110" : "group-hover:scale-110"
                                )} />
                                {item.badge && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 px-1 py-0 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center text-[10px] animate-bounce"
                                    >
                                        {item.badge}
                                    </Badge>
                                )}
                            </div>
                            <span className={cn(
                                "font-medium transition-all duration-300 whitespace-nowrap",
                                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
                            )}>
                                {item.label}
                                {isHovered && item.badge && (
                                    <Badge variant="destructive" className="ml-2 text-[10px]">{item.badge}</Badge>
                                )}
                            </span>

                            {/* Active Indicator Line */}
                            {activeTab === item.id && (
                                <div className="absolute left-0 w-1 h-6 bg-purple-600 rounded-r-full" />
                            )}

                            {/* Tooltip for collapsed state */}
                            {!isHovered && (
                                <div className="absolute left-full ml-4 px-3 py-1 bg-slate-900 text-white text-sm rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer / Sign Out */}
                <div className="px-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={onSignOut}
                        className={cn(
                            "w-full flex items-center gap-4 p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200 group relative"
                        )}
                    >
                        <LogOut className="w-6 h-6 shrink-0" />
                        <span className={cn(
                            "font-medium transition-all duration-300 whitespace-nowrap",
                            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
                        )}>
                            Quitter
                        </span>

                        {!isHovered && (
                            <div className="absolute left-full ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                                Quitter
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    )
}
