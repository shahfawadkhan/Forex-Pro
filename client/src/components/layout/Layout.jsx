import Sidebar from './Sidebar'
import Header from './Header'
import { useSelector } from 'react-redux'

export default function Layout({ children }) {
  const { darkMode } = useSelector(s => s.ui)
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Sidebar/>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header/>
          <main className="flex-1 overflow-y-auto p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  )
}
