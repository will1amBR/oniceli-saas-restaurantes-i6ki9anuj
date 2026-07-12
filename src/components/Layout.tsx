import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Header } from '@/components/header'
import { BottomNav } from '@/components/bottom-nav'
import { AiChat } from '@/components/ai-chat'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/20">
        <AppSidebar />
        <div className="flex w-full flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8 animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
      <AiChat />
    </SidebarProvider>
  )
}
