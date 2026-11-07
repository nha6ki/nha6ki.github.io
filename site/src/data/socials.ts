import { faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import * as icons from 'simple-icons';

interface HomeIcon {
  viewBox: string;
  path: string;
}

interface SocialProfile {
  name: string;
  url: string;
  icon: { svg: string } | null;
  homeIcon: HomeIcon | null;
}

function fontAwesomeIcon(icon: typeof faLinkedin): HomeIcon {
  const data = icon.icon[4];
  return {
    viewBox: `0 0 ${icon.icon[0]} ${icon.icon[1]}`,
    path: Array.isArray(data) ? data[0] : data,
  };
}

export const linkedinIcon = fontAwesomeIcon(faLinkedin);
const twitterIcon = fontAwesomeIcon(faXTwitter);

export const socials: SocialProfile[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/nha6ki',
    icon: icons.siGithub,
    homeIcon: null,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/harukiniwa',
    icon: null,
    homeIcon: linkedinIcon,
  },
  {
    name: 'DEV.to',
    url: 'https://dev.to/nha6ki',
    icon: icons.siDevdotto,
    homeIcon: null,
  },
  {
    name: 'Twitter',
    url: 'https://x.com/nha6ki',
    icon: icons.siX ?? null,
    homeIcon: twitterIcon,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/channel/UCziACJpCinuqWltWEQr54dg',
    icon: icons.siYoutube ?? null,
    homeIcon: null,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/suns._.n/',
    icon: icons.siInstagram,
    homeIcon: {
      viewBox: '0 0 24 24',
      path: icons.siInstagram.path,
    },
  },
];

export const homeSocials = socials.flatMap((social) =>
  social.homeIcon
    ? [{
        name: social.name,
        url: social.url,
        ...social.homeIcon,
      }]
    : []
);
