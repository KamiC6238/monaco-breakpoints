import './style/global.css';
import { createEditor } from './editor';
import MonacoBreakpoint from '@/core';
import '@/style/index.css';

const editor = createEditor('app');
editor && new MonacoBreakpoint({ editor });
