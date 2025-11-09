export default function Leaderboard() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-2">Leaderboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Top contributors ranked by points, wins, and contributions</p>
      </div>
      
      <div className="card">
        <div className="space-y-3">
          {/* First Place */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gold/20 to-gold-light/20 rounded-lg border-2 border-gold hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                U
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50 text-lg">Top User</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">1,234 points • 45 nodes • 12 stories</p>
              </div>
            </div>
            <span className="text-3xl">🏆</span>
          </div>
          
          {/* Second Place */}
          <div className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-900 dark:text-gray-50 font-bold">
                2
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-900 dark:text-gray-50 font-bold">
                U
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">Second User</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">987 points • 38 nodes • 9 stories</p>
              </div>
            </div>
            <span className="text-xl">🥈</span>
          </div>
          
          {/* Third Place */}
          <div className="flex items-center justify-between p-4 border-2 border-amber-300 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-amber-300 rounded-full flex items-center justify-center text-gray-900 dark:text-gray-50 font-bold">
                3
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-900 dark:text-gray-50 font-bold">
                U
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">Third User</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">654 points • 29 nodes • 7 stories</p>
              </div>
            </div>
            <span className="text-xl">🥉</span>
          </div>
          
          {/* More entries */}
          {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
            <div key={rank} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-bold">
                  {rank}
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-900 dark:text-gray-50 text-sm font-bold">
                  U
                </div>
                <div>
                <p className="font-semibold text-gray-900 dark:text-gray-50">User {rank}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{500 - rank * 50} points</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">Keep writing to climb the ranks!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

