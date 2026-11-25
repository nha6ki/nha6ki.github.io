// Shared topics for Blog and Projects; tags classify DEV.to articles.
export const categories = [
  { id: 'ai', label: 'AI & Machine Learning',
    tags: ['llm', 'ollama', 'openwebui', 'gemma', 'machinelearning',
      'deeplearning', 'optuna', 'pytorch', 'tensorflow', 'datascience',
      'scikitlearn', 'ai', 'ml'] },
  { id: 'neuro', label: 'Neuroscience',
    tags: ['neuroscience', 'neuroimaging', 'fmri', 'eeg', 'fsl', 'ants',
      'fmriprep', 'nifti', 'bids', 'computationalneuroscience'] },
  { id: 'infra', label: 'Systems & Infrastructure',
    tags: ['htcondor', 'hpc', 'networking', 'nas', 'raid', 'devops',
      'kubernetes', 'gcp', 'grafana', 'prometheus', 'cloud', 'dualboot'] },
  { id: 'data', label: 'Data Engineering & Automation',
    tags: ['automation', 'dataengineering', 'etl', 'datapipeline',
      'webscraping', 'datamigration', 'database', 'scrapy', 'rclone'] },
  { id: 'robotics', label: 'Robotics',
    tags: ['robotics', 'ros', 'ros2', 'robot'] },
  { id: 'web', label: 'Web & Applications',
    tags: ['webdev', 'astro', 'fastapi', 'javascript', 'typescript',
      'frontend', 'backend', 'html', 'css', 'webapp', 'softwaretesting'] },
] as const;
// Projects use technical filters independently of Blog topics.
export const projectCategories = [
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'web', label: 'Web Development & Testing' },
  { id: 'analysis', label: 'Data Analysis & Visualization' },
  { id: 'data', label: 'Data Engineering & Automation' },
  { id: 'infra', label: 'Systems & Infrastructure' },
  { id: 'robotics', label: 'Robotics' },
] as const;
// Paths are fixed UI icons, not data from DEV.to.
export const categoryIcons: Record<string, string> = {
  all: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  ai: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M7 8l4 8m6-8-4 8"/>',
  neuro: '<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  infra: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 7h.01M7 18h.01M11 7h7M11 18h7"/>',
  data: '<rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/><path d="M9 6h5a4 4 0 0 1 4 4v4M6 10v5a4 4 0 0 0 4 4h5"/>',
  robotics: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4m-3 0h6M8 13h.01M16 13h.01M9 17h6"/>',
  web: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 20"/>',
  analysis: '<path d="M4 3v17h17M8 16v-5m5 5V7m5 9V4"/>',
  other: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a3 3 0 1 1 5 2c-1.5 1-2.5 2-2.5 3m0 3h.01"/>',
};
