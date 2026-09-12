import { SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  entryFile: 'app/main.tsx',
  enableBarrelLess: true,
  modules: {
    'app/routes': 'type:app',
    'app/components/login': 'type:feature',
    'app/components/vacancies': 'type:feature',
    'app/components/applications': 'type:feature',
    'app/components/layout': 'type:layout',
    'app/components/elements': 'type:ui',
    'app/lib': 'type:lib',
  },
  depRules: {
    'type:app': ['type:feature', 'type:ui', 'type:layout', 'type:lib', 'root'],
    'type:feature': ['type:ui', 'type:layout', 'type:lib'],
    'type:layout': ['type:ui', 'type:lib'],
    'type:ui': ['type:lib'],
    'type:lib': ['type:lib'],
    root: ['type:app', 'type:feature', 'type:ui', 'type:layout', 'type:lib', 'root'],
  },
};