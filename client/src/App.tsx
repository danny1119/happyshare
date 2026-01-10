import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GroupPage from './pages/GroupPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-primary">
            HappyShare
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/group/:groupId" element={<GroupPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
