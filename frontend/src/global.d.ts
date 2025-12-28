// ملف تعريف الأنواع العامة لحل مشاكل TypeScript
// حل مشاكل الأخطاء:
/// <reference types="node" />
/// <reference types="react-native" />
/// <reference types="yargs" />

// تعريف الأنواع الأساسية
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }

  // تعريف types للحزم المفقودة
  namespace yargs {
    interface Argv {
      [key: string]: unknown;
      _: string[];
      '$0': string;
    }
  }

  namespace ReactNative {
    interface ViewProps {
      style?: any;
    }
    
    interface TextProps {
      style?: any;
    }
    
    interface ButtonProps {
      title: string;
      onPress?: () => void;
      disabled?: boolean;
    }
  }
}

export {};
