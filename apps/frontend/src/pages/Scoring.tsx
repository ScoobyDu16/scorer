import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function Scoring() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const [ballData, setBallData] = useState({
    runs: 0,
    isWicket: false,
    wicketType: '',
    extraType: '',
    extraRuns: 0,
  })

  const handleBallSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: API call to record ball
    console.log('Recording ball:', ballData, 'for match:', matchId)
  }

  const handleUndo = () => {
    // TODO: API call to undo last ball
    console.log('Undoing last ball for match:', matchId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Live Scoring</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Exit Match
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Match Score</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700">Team A</h3>
                  <p className="text-2xl font-bold text-blue-600">120/4</p>
                  <p className="text-sm text-gray-600">15.3 overs</p>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700">Team B</h3>
                  <p className="text-2xl font-bold text-green-600">0/0</p>
                  <p className="text-sm text-gray-600">0.0 overs</p>
                </div>
              </div>
            </div>

            {/* Ball Recording */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Ball</h2>
              <form onSubmit={handleBallSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Runs
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={ballData.runs}
                      onChange={(e) => setBallData({ ...ballData, runs: parseInt(e.target.value) })}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map(run => (
                        <option key={run} value={run}>{run}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extras
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={ballData.extraType}
                      onChange={(e) => setBallData({ ...ballData, extraType: e.target.value })}
                    >
                      <option value="">None</option>
                      <option value="WIDE">Wide</option>
                      <option value="NO_BALL">No Ball</option>
                      <option value="BYE">Bye</option>
                      <option value="LEG_BYE">Leg Bye</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={ballData.isWicket}
                      onChange={(e) => setBallData({ ...ballData, isWicket: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Wicket</span>
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
                  >
                    Record Ball
                  </button>
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
                  >
                    Undo Last Ball
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Recent Balls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Balls</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">15.3</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">15.2</span>
                <span className="font-medium">W</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">15.1</span>
                <span className="font-medium">1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
