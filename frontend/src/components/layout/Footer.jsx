import { Link } from 'react-router-dom';
import { GraduationCap, Globe, Share2, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span>Vertex<span className="text-blue-400">Portal</span></span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Empowering learners worldwide with world-class courses, AI tutors, interactive quizzes, and live learning experiences.
            </p>
            <div className="flex gap-2 pt-2">
              {[Globe, Share2, MessageSquare].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-gray-800 hover:bg-blue-600 hover:text-white rounded-lg text-gray-400 transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Learn</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/courses" className="hover:text-white">Browse Courses</Link></li>
              <li><Link to="/discussions" className="hover:text-white">Discussions</Link></li>
              <li><Link to="/ai-chat" className="hover:text-white">AI Tutor Assistant</Link></li>
              <li><Link to="/my-learning" className="hover:text-white">My Learning Portal</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/student/live-classes" className="hover:text-white">Live Classes</Link></li>
              <li><Link to="/student/quizzes" className="hover:text-white">Quizzes & Assessments</Link></li>
              <li><Link to="/student/assignments" className="hover:text-white">Assignments</Link></li>
              <li><Link to="/certificates" className="hover:text-white">Certificates</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support & Legal</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Support</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} VertexPortal. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with Tailwind CSS & React Redux Toolkit</p>
        </div>
      </div>
    </footer>
  );
}
