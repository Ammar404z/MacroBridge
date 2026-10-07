import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './hooks/useAuth'
import FoodEdit from './pages/FoodEdit'
import FoodLog from './pages/FoodLog'
import Foods from './pages/Foods'
import FriendProfile from './pages/FriendProfile'
import Friends from './pages/Friends'
import ChangePassword from './pages/ChangePassword'
import EditMeal from './pages/EditMeal'
import Invite from './pages/Invite'
import LogMeal from './pages/LogMeal'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Signup from './pages/Signup'
import Suggest from './pages/Suggest'
import Today from './pages/Today'

const authed = (page: React.ReactNode) => <ProtectedRoute>{page}</ProtectedRoute>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={authed(<Today />)} />
          <Route path="/log" element={authed(<LogMeal />)} />
          <Route path="/meals/:id" element={authed(<EditMeal />)} />
          <Route path="/suggest" element={authed(<Suggest />)} />
          <Route path="/foods" element={authed(<Foods />)} />
          <Route path="/foods/new" element={authed(<FoodEdit />)} />
          <Route path="/foods/:id" element={authed(<FoodEdit />)} />
          <Route path="/foods/:id/log" element={authed(<FoodLog />)} />
          <Route path="/friends" element={authed(<Friends />)} />
          <Route path="/friends/:id" element={authed(<FriendProfile />)} />
          <Route path="/invite/:code" element={<Invite />} />
          <Route path="/profile" element={authed(<Profile />)} />
          <Route path="/profile/password" element={authed(<ChangePassword />)} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
