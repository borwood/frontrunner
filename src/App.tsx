import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './theme/ThemeContext'
import { UserProvider, useUser } from './contexts/UserContext'
import { UnifiedStorageProvider } from './contexts/UnifiedStorageContext'
import { GalleryProvider } from './contexts/GalleryContext'
import { RunnersProvider } from './contexts/RunnersContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { GenerationFavoritesProvider } from './contexts/GenerationFavoritesContext'
import { GenerationQueueProvider } from './contexts/GenerationQueueContext'
import { ChatProvider } from './contexts/ChatContext'
import { PageLayout } from './components/Layout/PageLayout'
import { Home } from './pages/Home'
import { Runners } from './pages/Runners'
import { ModelRunner } from './pages/ModelRunner'
import { Gallery } from './pages/Gallery'
import { Profile } from './pages/Profile'
import { Chat } from './pages/Chat'

// Auth redirect handler - redirects to /chat if user signed in with pending message
function AuthRedirectHandler() {
  const { isSignedIn } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Only check once when user becomes signed in
    if (isSignedIn) {
      const pendingMessage = sessionStorage.getItem('pendingChatMessage')

      // If there's a pending message and we're not already on /chat, redirect
      if (pendingMessage && location.pathname !== '/chat') {
        navigate('/chat')
      }
    }
  }, [isSignedIn, navigate, location.pathname])

  return null
}

// Layout wrapper that persists across routes
function Layout() {
  return (
    <PageLayout showHeader={true} showNav={true}>
      <AuthRedirectHandler />
      <Outlet />
    </PageLayout>
  )
}

export default function App() {
  return (
    <UserProvider>
      <UnifiedStorageProvider>
        <ThemeProvider>
          <FavoritesProvider>
            <GenerationFavoritesProvider>
              <GenerationQueueProvider>
                <GalleryProvider>
                  <RunnersProvider>
                    <ChatProvider>
                      <BrowserRouter>
                        <Routes>
                          <Route element={<Layout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/runners" element={<Runners />} />
                            <Route path="/runners/:modelId" element={<ModelRunner />} />
                            <Route path="/gallery" element={<Gallery />} />
                            <Route path="/chat" element={<Chat />} />
                            <Route path="/profile" element={<Profile />} />
                          </Route>
                        </Routes>
                      </BrowserRouter>
                    </ChatProvider>
                  </RunnersProvider>
                </GalleryProvider>
              </GenerationQueueProvider>
            </GenerationFavoritesProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </UnifiedStorageProvider>
    </UserProvider>
  )
}
