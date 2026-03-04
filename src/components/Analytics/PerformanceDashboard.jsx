import { useMemo } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Eye, Heart, Share2, MessageCircle, FileText, BarChart3 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const PLATFORM_COLORS = {
  Instagram: '#e4405f',
  LinkedIn: '#0a66c2',
  Facebook: '#1877f2',
  TikTok: '#111827',
}

const STAGE_LABELS = ['Content Dump', 'Bearbeitung', 'Int. Review', 'Approval', 'Freigegeben', 'Published']
const STAGE_COLORS = [
  'rgba(156,163,175,0.75)',
  'rgba(59,130,246,0.75)',
  'rgba(234,179,8,0.75)',
  'rgba(168,85,247,0.75)',
  'rgba(16,185,129,0.75)',
  'rgba(5,150,105,0.75)',
]

function toDate(val) {
  if (!val) return null
  if (typeof val?.toDate === 'function') return val.toDate()
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function last6Months() {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return {
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    }
  })
}

export default function PerformanceDashboard({ posts = [], articles = [] }) {
  const months = useMemo(last6Months, [])

  const stats = useMemo(() => {
    const published = posts.filter(p => p.stage >= 5)
    const totalReach = published.reduce((s, p) => s + (p.metrics?.reach || 0), 0)
    const totalEng = published.reduce(
      (s, p) => s + (p.metrics?.likes || 0) + (p.metrics?.shares || 0) + (p.metrics?.comments || 0),
      0
    )
    return {
      totalPosts: posts.length,
      publishedPosts: published.length,
      totalArticles: articles.length,
      avgEngagement: totalReach > 0 ? ((totalEng / totalReach) * 100).toFixed(1) : '0.0',
    }
  }, [posts, articles])

  const platformStats = useMemo(() => {
    const map = {}
    posts.forEach(p => {
      if (!map[p.platform]) map[p.platform] = { count: 0, reach: 0, likes: 0 }
      map[p.platform].count++
      map[p.platform].reach += p.metrics?.reach || 0
      map[p.platform].likes += p.metrics?.likes || 0
    })
    return Object.entries(map).map(([name, d]) => ({ name, ...d }))
  }, [posts])

  const monthlyActivity = useMemo(() =>
    months.map(m => ({
      label: m.label,
      posts: posts.filter(p => {
        const d = toDate(p.scheduledDate || p.createdAt)
        return d && d.getFullYear() === m.year && d.getMonth() === m.month
      }).length,
      articles: articles.filter(a => {
        const d = toDate(a.lastModified || a.createdAt)
        return d && d.getFullYear() === m.year && d.getMonth() === m.month
      }).length,
    }))
  , [posts, articles, months])

  const pipelineCounts = useMemo(
    () => STAGE_LABELS.map((_, i) => posts.filter(p => p.stage === i).length),
    [posts]
  )

  // Chart: monthly activity (bar)
  const activityChartData = {
    labels: monthlyActivity.map(m => m.label),
    datasets: [
      {
        label: 'Social Posts',
        data: monthlyActivity.map(m => m.posts),
        backgroundColor: 'rgba(76,110,245,0.7)',
        borderRadius: 6,
      },
      {
        label: 'SEO Artikel',
        data: monthlyActivity.map(m => m.articles),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6,
      },
    ],
  }

  // Chart: platform doughnut
  const platformChartData = {
    labels: platformStats.length > 0 ? platformStats.map(p => p.name) : ['Keine Posts'],
    datasets: [{
      data: platformStats.length > 0 ? platformStats.map(p => p.count) : [1],
      backgroundColor: platformStats.length > 0
        ? platformStats.map(p => PLATFORM_COLORS[p.name] || '#6b7280')
        : ['#e5e7eb'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  }

  // Chart: pipeline bar
  const pipelineChartData = {
    labels: STAGE_LABELS,
    datasets: [{
      label: 'Posts',
      data: pipelineCounts,
      backgroundColor: STAGE_COLORS,
      borderRadius: 6,
    }],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 12, usePointStyle: true, font: { size: 11 } } },
    },
    scales: {
      y: { ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(156,163,175,0.1)' } },
      x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 16, usePointStyle: true } },
    },
    cutout: '65%',
  }

  const statCards = [
    { label: 'Gesamt Posts', value: stats.totalPosts, icon: Share2, color: 'bg-purple-500' },
    { label: 'Veröffentlicht', value: stats.publishedPosts, icon: Eye, color: 'bg-blue-500' },
    { label: 'SEO Artikel', value: stats.totalArticles, icon: FileText, color: 'bg-green-500' },
    { label: 'Avg. Engagement', value: `${stats.avgEngagement}%`, icon: Heart, color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Content Aktivität (letzte 6 Monate)
          </h3>
          <div className="h-64">
            <Bar data={activityChartData} options={barOptions} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Plattform-Verteilung</h3>
          <div className="h-64">
            <Doughnut data={platformChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Pipeline status */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Content Pipeline Status</h3>
        <div className="h-48">
          <Bar
            data={pipelineChartData}
            options={{ ...barOptions, plugins: { ...barOptions.plugins, legend: { display: false } } }}
          />
        </div>
      </div>

      {/* Platform detail table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Plattform-Details</h3>
        </div>
        {platformStats.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Noch keine Posts vorhanden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Plattform</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Posts</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Reichweite</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {platformStats.map(p => (
                <tr key={p.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.name] || '#6b7280' }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{p.count}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                    {p.reach.toLocaleString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                    {p.likes.toLocaleString('de-DE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
