import { useState } from 'react'
import { getModeColors } from '../utils/modeColors'

export function TaskItem({ task, isActive, onSelect, onUpdate, onDelete, mode, isDarkMode }) {
  const colors = getModeColors(mode)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editEstimate, setEditEstimate] = useState(task.estimatedPomodoros)

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate({
        ...task,
        title: editTitle.trim(),
        estimatedPomodoros: editEstimate
      })
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(task.title)
      setEditEstimate(task.estimatedPomodoros)
      setIsEditing(false)
    }
  }

  const toggleComplete = (e) => {
    e.stopPropagation()
    onUpdate({ ...task, isCompleted: !task.isCompleted })
  }

  if (isEditing) {
    return (
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-black/10'}`}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full px-3 py-2 rounded-lg border-0 mb-3 ${
            isDarkMode
              ? 'bg-gray-600 text-white placeholder-gray-400'
              : 'bg-white/20 text-white placeholder-white/50'
          }`}
          autoFocus
        />
        <div className="flex items-center gap-3">
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-white/70'}`}>
            Pomodoros:
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setEditEstimate(num)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                  editEstimate >= num
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditTitle(task.title)
              setEditEstimate(task.estimatedPomodoros)
              setIsEditing(false)
            }}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isActive
          ? `bg-gradient-to-r ${colors.bgActive} ring-2 ${colors.ring}`
          : isDarkMode
            ? 'bg-gray-700/30 hover:bg-gray-700/50'
            : 'bg-white/5 hover:bg-white/10'
      } ${task.isCompleted ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={toggleComplete}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent'
              : isDarkMode
                ? 'border-gray-500 hover:border-emerald-500'
                : 'border-white/30 hover:border-white/60'
          }`}
        >
          {task.isCompleted && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task title */}
        <span className={`flex-1 ${
          task.isCompleted ? 'line-through' : ''
        } text-white font-medium`}>
          {task.title}
        </span>

        {/* Pomodoro count */}
        <div className="flex items-center gap-1">
          {[...Array(task.estimatedPomodoros)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < task.completedPomodoros
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : isDarkMode
                    ? 'bg-gray-600'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsEditing(true)
          }}
          className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
          className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'text-white/50 hover:text-red-300 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
