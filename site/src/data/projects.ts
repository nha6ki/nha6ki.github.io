export interface Project {
  slug: string;
  title: string;
  summary: string;
  technologies: string[];
}

export const projects: Project[] = [
  {
    slug: 'art-museum-recommender',
    title: 'Art & Museum Recommender',
    summary: 'A web application for personalized artwork recommendations.',
    technologies: ['Python', 'FastAPI', 'Machine Learning', 'Cloud Run'],
  },
  {
    slug: 'scene-to-art',
    title: 'Scene → Art',
    summary: 'Exploring artwork recommendations based on visual preferences.',
    technologies: ['Python', 'Machine Learning', 'Recommendation Systems'],
  },
  {
    slug: 'htcondor-cluster',
    title: 'HTCondor Computing Cluster',
    summary: 'Distributed computing infrastructure for research workloads.',
    technologies: ['Linux', 'HTCondor', 'Docker', 'Grafana'],
  },
  {
    slug: 'eeg-fmri',
    title: 'EEG–fMRI Translation',
    summary: 'Research on cross-modal modeling of brain activity.',
    technologies: ['PyTorch', 'EEG', 'fMRI', 'Deep Learning'],
  },
];
