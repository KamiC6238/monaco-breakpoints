import './style.css';
import { createEditor } from './editor';
import MonacoBreakpointPlugin from '@/core';
import '@/style/index.css';

const editor = createEditor('app');
editor && new MonacoBreakpointPlugin({ editor });
