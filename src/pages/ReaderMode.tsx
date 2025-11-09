import { useParams, Link } from 'react-router-dom'

export default function ReaderMode() {
  const { roomId } = useParams()
  
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Reader Mode</h1>
            <p className="text-gray-600 dark:text-gray-400">Explore and traverse story paths</p>
          </div>
          <Link to={`/room/${roomId}`} className="btn-secondary whitespace-nowrap">
            Edit Mode
          </Link>
        </div>
        
        <div className="card min-h-[400px]">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Story Explorer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Interactive story exploration interface will go here. Click nodes to follow different story paths.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary">Start Reading</button>
              <Link to={`/room/${roomId}`} className="btn-primary">
                Contribute
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

