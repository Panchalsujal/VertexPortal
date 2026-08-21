import os
import sys

try:
    import markdown
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'markdown'])
    import markdown

docs_dir = '.'
md_files = [f for f in os.listdir(docs_dir) if f.endswith('.md')]
md_files.sort() # Ensure consistent ordering

# Generate sidebar and content
sidebar_html = ""
content_html = ""

for filename in md_files:
    section_id = filename.replace('.md', '').replace(' ', '_').lower()
    section_title = filename.replace('.md', '').replace('_', ' ').title()
    
    sidebar_html += f'          <li><a href="#{section_id}" class="sidebar-link block py-2.5 px-4 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-[#1e2330] transition-all duration-200">{section_title}</a></li>\n'
    
    in_path = os.path.join(docs_dir, filename)
    with open(in_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    html = markdown.markdown(text, extensions=['extra', 'toc', 'fenced_code'])
    
    content_html += f'<section id="{section_id}" class="doc-section mb-24 scroll-mt-24">\n'
    content_html += f'  <div class="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-2xl prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-xl prose-img:shadow-lg">\n'
    content_html += f'    <h1 class="text-slate-900 dark:text-slate-100 mb-10 pb-4 border-b border-slate-200 dark:border-[#30363d]">{section_title}</h1>\n'
    content_html += f'    {html}\n'
    content_html += f'  </div>\n'
    content_html += '</section>\n\n'

# Single HTML skeleton with Tailwind, Typography, and PrismJS
html_content = f"""<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VertexPortal Documentation</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS with Typography Plugin -->
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script>
        tailwind.config = {{
            darkMode: 'class',
            theme: {{
                extend: {{
                    fontFamily: {{
                        sans: ['Inter', 'sans-serif'],
                        mono: ['Fira Code', 'monospace'],
                    }},
                    typography: {{
                        DEFAULT: {{
                            css: {{
                                maxWidth: '100%',
                                code: {{
                                    backgroundColor: '#f1f5f9',
                                    padding: '0.25rem 0.375rem',
                                    borderRadius: '0.375rem',
                                    fontWeight: '500',
                                    color: '#0f172a',
                                }},
                                'code::before': {{ content: 'none' }},
                                'code::after': {{ content: 'none' }},
                                pre: {{
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                }}
                            }}
                        }},
                        invert: {{
                            css: {{
                                color: '#94a3b8',
                                h1: {{ color: '#f1f5f9' }},
                                h2: {{ color: '#f1f5f9' }},
                                h3: {{ color: '#e2e8f0' }},
                                h4: {{ color: '#e2e8f0' }},
                                strong: {{ color: '#f1f5f9' }},
                                code: {{
                                    backgroundColor: '#1e293b',
                                    color: '#e2e8f0',
                                }},
                                blockquote: {{
                                    color: '#94a3b8',
                                    borderLeftColor: '#3b82f6',
                                }},
                                tbody: {{
                                    tr: {{
                                        borderBottomColor: '#1e293b',
                                    }}
                                }},
                                thead: {{
                                    borderBottomColor: '#1e293b',
                                    th: {{
                                        color: '#cbd5e1',
                                    }}
                                }}
                            }}
                        }}
                    }}
                }}
            }}
        }}
    </script>

    <!-- PrismJS Theme (One Dark style) -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
    
    <style>
        /* Custom scrollbar for a polished look */
        ::-webkit-scrollbar {{ width: 6px; height: 6px; }}
        ::-webkit-scrollbar-track {{ background: transparent; }}
        ::-webkit-scrollbar-thumb {{ background: #cbd5e1; border-radius: 4px; }}
        .dark ::-webkit-scrollbar-thumb {{ background: #334155; }}
        ::-webkit-scrollbar-thumb:hover {{ background: #94a3b8; }}
        .dark ::-webkit-scrollbar-thumb:hover {{ background: #475569; }}

        .sidebar-link.active {{
            background-color: #eff6ff;
            color: #2563eb;
            font-weight: 600;
        }}
        .dark .sidebar-link.active {{
            background-color: #1e293b;
            color: #60a5fa;
            border-right: 3px solid #3b82f6;
        }}
        
        /* Layout */
        .sidebar {{
            height: 100vh;
            position: sticky;
            top: 0;
            overflow-y: auto;
        }}
        
        pre[class*="language-"] {{
            border-radius: 0.75rem;
            margin: 1.5em 0;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            background-color: #0f172a !important; /* Richer dark code background */
        }}
    </style>
</head>
<body class="bg-white dark:bg-[#0b1120] text-slate-900 dark:text-slate-300 antialiased selection:bg-blue-200 selection:text-blue-900 dark:selection:bg-blue-900/50 dark:selection:text-blue-100 transition-colors duration-300">

    <div class="flex min-h-screen max-w-[90rem] mx-auto">
        <!-- Sidebar -->
        <aside class="sidebar w-72 border-r border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0f172a] hidden md:block">
            <div class="p-8">
                <div class="flex items-center justify-between mb-10">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 tracking-tight">VertexPortal</span>
                    </div>
                    
                    <!-- Dark Mode Toggle -->
                    <button id="theme-toggle" class="p-2.5 rounded-xl bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Toggle Dark Mode">
                        <svg id="theme-toggle-dark-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                        </svg>
                        <svg id="theme-toggle-light-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
                        </svg>
                    </button>
                </div>
                <nav class="space-y-2">
                    <p class="px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Documentation</p>
                    <ul class="space-y-1">
{sidebar_html}
                    </ul>
                </nav>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-w-0 bg-white dark:bg-[#0b1120]">
            <div class="px-8 py-12 lg:px-24 lg:py-20 mx-auto max-w-5xl">
{content_html}
            </div>
        </main>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>

    <script>
        // Dark Mode Logic
        const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
        const themeToggleBtn = document.getElementById('theme-toggle');

        if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {{
            document.documentElement.classList.add('dark');
            themeToggleLightIcon.classList.remove('hidden');
        }} else {{
            themeToggleDarkIcon.classList.remove('hidden');
        }}

        themeToggleBtn.addEventListener('click', function() {{
            themeToggleDarkIcon.classList.toggle('hidden');
            themeToggleLightIcon.classList.toggle('hidden');

            if (localStorage.getItem('color-theme')) {{
                if (localStorage.getItem('color-theme') === 'light') {{
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }} else {{
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }}
            }} else {{
                if (document.documentElement.classList.contains('dark')) {{
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('color-theme', 'light');
                }} else {{
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('color-theme', 'dark');
                }}
            }}
        }});

        // Intersection Observer for Sidebar Highlighting
        document.addEventListener('DOMContentLoaded', () => {{
            const sections = document.querySelectorAll('.doc-section');
            const navLinks = document.querySelectorAll('.sidebar-link');

            const observerOptions = {{
                root: null,
                rootMargin: '-20% 0px -80% 0px',
                threshold: 0
            }};

            const observer = new IntersectionObserver((entries) => {{
                entries.forEach(entry => {{
                    if (entry.isIntersecting) {{
                        const id = entry.target.getAttribute('id');
                        navLinks.forEach(link => {{
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${{id}}`) {{
                                link.classList.add('active');
                            }}
                        }});
                    }}
                }});
            }}, observerOptions);

            sections.forEach(section => observer.observe(section));
        }});
        
        // Setup syntax highlighting classes
        document.querySelectorAll('pre code').forEach((block) => {{
            if (!block.className.includes('language-')) {{
                block.classList.add('language-javascript'); // fallback
            }}
        }});
    </script>
</body>
</html>"""

out_path = os.path.join(docs_dir, 'index.html')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
    
print(f'Successfully generated single file: index.html with {len(md_files)} documents.')
