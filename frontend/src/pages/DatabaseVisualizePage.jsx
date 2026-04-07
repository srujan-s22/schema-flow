import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import SidebarLayout from '../layouts/SidebarLayout'
import { getStoredUser } from '../services/api'

// ── Custom Node Components ──

function TableNode({ data }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-[var(--color-border)] min-w-[260px] overflow-hidden font-sans group hover:shadow-lg hover:border-[var(--color-slate-400)] transition-all">
      <div className="bg-gray-900 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-white tracking-wide">{data.label}</span>
      </div>
      <div className="flex flex-col text-xs text-[var(--color-slate-700)] p-1">
        {data.columns.map((col, idx) => (
          <div key={col.name} className={`px-4 py-2.5 flex justify-between items-center ${idx !== data.columns.length - 1 ? 'border-b border-[var(--color-border)]' : ''}`}>
            <div className="flex items-center gap-2.5">
              {col.isPk ? (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-sm" title="Primary Key"></span>
              ) : col.isFk ? (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" title="Foreign Key"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-transparent"></span>
              )}
              <span className={`font-mono ${col.isPk ? 'font-bold text-[var(--color-slate-900)]' : 'font-medium text-[var(--color-slate-800)]'}`}>{col.name}</span>
            </div>
            <span className="text-[var(--color-slate-500)] italic">{col.type}</span>
          </div>
        ))}
      </div>
      {/* Invisible handles for connecting edges dynamically to the nodes */}
      <Handle type="target" position={Position.Top} className="opacity-0 w-4 h-4" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-4 h-4" />
      <Handle type="target" position={Position.Left} className="opacity-0 w-4 h-4" />
      <Handle type="source" position={Position.Right} className="opacity-0 w-4 h-4" />
    </div>
  )
}

const nodeTypes = { tableNode: TableNode }

// ── Diagram Initial State ──

const initialNodes = [
  {
    id: 'users',
    type: 'tableNode',
    position: { x: 50, y: 50 },
    data: {
      label: 'users',
      columns: [
        { name: 'user_id', type: 'INT (PK)', isPk: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR (UK)' },
        { name: 'password', type: 'VARCHAR' },
        { name: 'role', type: "ENUM('student', 'teacher')" },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    }
  },
  {
    id: 'courses',
    type: 'tableNode',
    position: { x: 450, y: 50 },
    data: {
      label: 'courses',
      columns: [
        { name: 'course_id', type: 'INT (PK)', isPk: true },
        { name: 'course_name', type: 'VARCHAR' },
        { name: 'teacher_id', type: 'INT (FK)', isFk: true },
        { name: 'max_seats', type: 'INT' },
        { name: 'available_seats', type: 'INT' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    }
  },
  {
    id: 'enrollments',
    type: 'tableNode',
    position: { x: 250, y: 350 },
    data: {
      label: 'enrollments (junction)',
      columns: [
        { name: 'student_id', type: 'INT (PK, FK)', isPk: true, isFk: true },
        { name: 'course_id', type: 'INT (PK, FK)', isPk: true, isFk: true },
        { name: 'enrolled_at', type: 'TIMESTAMP' }
      ]
    }
  },
  {
    id: 'units',
    type: 'tableNode',
    position: { x: 450, y: 350 },
    data: {
      label: 'units',
      columns: [
        { name: 'unit_id', type: 'INT (PK)', isPk: true },
        { name: 'course_id', type: 'INT (FK)', isFk: true },
        { name: 'unit_name', type: 'VARCHAR' },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    }
  },
  {
    id: 'notes',
    type: 'tableNode',
    position: { x: 450, y: 580 },
    data: {
      label: 'notes',
      columns: [
        { name: 'note_id', type: 'INT (PK)', isPk: true },
        { name: 'unit_id', type: 'INT (FK)', isFk: true },
        { name: 'file_url', type: 'VARCHAR' },
        { name: 'uploaded_by', type: 'INT (FK)', isFk: true },
        { name: 'created_at', type: 'TIMESTAMP' }
      ]
    }
  }
]

const initialEdges = [
  {
    id: 'e-users-courses',
    source: 'users',
    target: 'courses',
    sourceHandle: null,
    targetHandle: null,
    animated: true,
    label: '1 : N (Teacher)',
    style: { stroke: 'var(--color-slate-400)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-400)' }
  },
  {
    id: 'e-users-enroll',
    source: 'users',
    target: 'enrollments',
    animated: true,
    label: '1 : N (Student)',
    style: { stroke: 'var(--color-slate-400)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-400)' }
  },
  {
    id: 'e-courses-enroll',
    source: 'courses',
    target: 'enrollments',
    animated: true,
    label: '1 : N (Course)',
    style: { stroke: 'var(--color-slate-400)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-400)' }
  },
  {
    id: 'e-courses-units',
    source: 'courses',
    target: 'units',
    animated: true,
    label: '1 : N',
    style: { stroke: 'var(--color-slate-400)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-400)' }
  },
  {
    id: 'e-units-notes',
    source: 'units',
    target: 'notes',
    animated: true,
    label: '1 : N',
    style: { stroke: 'var(--color-slate-400)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-400)' }
  },
  {
    id: 'e-users-notes',
    source: 'users',
    target: 'notes',
    animated: true,
    label: '1 : N (Uploader)',
    type: 'smoothstep',
    style: { stroke: 'var(--color-slate-300)', strokeWidth: 1.5, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-slate-300)' }
  }
]

export default function DatabaseVisualizePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const user = getStoredUser()
  const navigate = useNavigate()

  const navItems = user?.role === 'teacher'
    ? [{ label: 'Admin Dashboard', path: '/admin' }]
    : [{ label: 'Dashboard', path: '/dashboard' }]

  return (
    <SidebarLayout navItems={navItems} brandLabel="SchemaFlow">
      <div className="flex flex-col relative w-full rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-alt)] shadow-sm">

        {/* Header bar */}
        <div className="relative z-20 px-6 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-slate-900)] tracking-tight">Database Schema</h1>
            <p className="text-xs font-semibold text-[var(--color-slate-500)] mt-1 uppercase tracking-wider">
              Interactive Entity-Relationship Diagram (3NF)
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-[13px] font-semibold text-[var(--color-slate-500)] hover:text-[var(--color-slate-900)] bg-[var(--color-surface-alt)] hover:bg-[var(--color-border)] px-4 py-2 rounded-xl border border-[var(--color-border)] transition-colors cursor-pointer"
          >
            ← Return to Dashboard
          </button>
        </div>

        {/* Dynamic Canvas Container */}
        <div className="w-full h-[calc(100vh-140px)] min-h-[700px] relative bg-[var(--color-surface-alt)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.5}
            className="bg-[var(--color-surface-alt)]"
          >
            <Controls className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-md rounded-lg overflow-hidden fill-[var(--color-slate-700)] [&>button]:border-[var(--color-border)] [&>button]:bg-[var(--color-surface)] hover:[&>button]:bg-[var(--color-surface-alt)]" />

            <MiniMap
              nodeColor="var(--color-slate-300)"
              maskColor="var(--color-surface-alt)"
              className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md rounded-lg overflow-hidden"
            />

            <Background color="var(--color-slate-300)" gap={16} size={1.5} />
          </ReactFlow>
        </div>

      </div>
    </SidebarLayout>
  )
}
