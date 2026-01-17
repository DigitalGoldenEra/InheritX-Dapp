import {
  FaArrowRight,
  FaBalanceScale,
  FaFeatherAlt,
  FaLeaf,
  FaLock,
  FaRegHandshake,
} from 'react-icons/fa';

export const processSteps = [
  {
    id: '1',
    title: 'Plant the Roots',
    description: 'Add your assets and choose your beneficiaries in minutes.',
    icon: FaLeaf,
    iconClassName: 'text-2xl text-white',
  },
  {
    id: '2',
    title: 'Grow the Branches',
    description: 'Set rules that define who receives what and when.',
    icon: FaRegHandshake,
    iconClassName: 'text-2xl text-white',
  },
  {
    id: '3',
    title: 'Watch It Bloom',
    description: 'We automate the rest so transfers stay smooth and secure.',
    icon: FaFeatherAlt,
    iconClassName: 'text-2xl text-white',
  },
] as const;

export const benefitCards = [
  {
    title: 'Easy to Use',
    description: 'Clear, jargon-free steps that anyone in the family can follow.',
    icon: FaArrowRight,
    iconClassName: 'text-xl',
  },
  {
    title: 'Secure & Private',
    description: 'Top-tier encryption keeps every asset and instruction locked down.',
    icon: FaLock,
    iconClassName: 'text-xl',
  },
  {
    title: 'Custom Plans',
    description: 'Create personalized playbooks for every beneficiary.',
    icon: FaBalanceScale,
    iconClassName: 'text-xl',
  },
  {
    title: 'Stress-Free Transfers',
    description: 'We coordinate the fine print so your legacy arrives on time.',
    icon: FaRegHandshake,
    iconClassName: 'text-xl',
  },
] as const;
