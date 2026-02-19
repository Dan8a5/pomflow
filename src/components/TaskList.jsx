import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { TaskItem } from './TaskItem'

export function TaskList({ tasks, activeTaskId, mode, onTaskSelect, onTaskAdd, onTaskUpdate, onTaskDelete, onTaskReorder, isDarkMode }) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState(1)
  const [newTaskNotes, setNewTaskNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onTaskAdd({
        id: crypto.randomUUID(),
        title: newTaskTitle.trim(),
        estimatedPomodoros: newTaskEstimate,
        completedPomodoros: 0,
        isCompleted: false,
        notes: newTaskNotes.trim()
      })
      setNewTaskTitle('')
      setNewTaskEstimate(1)
      setNewTaskNotes('')
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTask()
    } else if (e.key === 'Escape') {
      setNewTaskTitle('')
      setNewTaskEstimate(1)
      setIsAdding(false)
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeTasks = tasks.filter(t => !t.isCompleted)
  const completedTasks = tasks.filter(t => t.isCompleted)

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = activeTasks.findIndex(t => t.id === active.id)
      const newIndex = activeTasks.findIndex(t => t.id === over.id)
      onTaskReorder(arrayMove(activeTasks, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-2">
      {/* Task list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {activeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={task.id === activeTaskId}
              onSelect={onTaskSelect}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              mode={mode}
              isDarkMode={isDarkMode}
              isDraggable
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add task form */}
      {isAdding ? (
        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-black/10'}`}>
          <input
            type="text"
            placeholder="What are you working on?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-2 rounded-lg border-0 mb-2 ${
              isDarkMode
                ? 'bg-gray-600 text-white placeholder-gray-400'
                : 'bg-white/20 text-white placeholder-white/50'
            }`}
            autoFocus
          />
          <textarea
            placeholder="Notes (optional)"
            value={newTaskNotes}
            onChange={(e) => setNewTaskNotes(e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 rounded-lg border-0 mb-3 text-sm resize-none ${
              isDarkMode
                ? 'bg-gray-600 text-white placeholder-gray-400'
                : 'bg-white/20 text-white placeholder-white/50'
            }`}
          />
          <div className="flex items-center gap-3">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-white/70'}`}>
              Pomodoros:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setNewTaskEstimate(num)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                    newTaskEstimate >= num
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
                setNewTaskTitle('')
                setNewTaskEstimate(1)
                setNewTaskNotes('')
                setIsAdding(false)
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-4 py-1.5 rounded-lg text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className={`w-full p-4 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-center gap-2 ${
            isDarkMode
              ? 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-400'
              : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/70'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div className="pt-4">
          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-500' : 'text-white/40'}`}>
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                onSelect={onTaskSelect}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
