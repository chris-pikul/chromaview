import type { FC, PropsWithChildren } from 'react';

const NoBr:FC<PropsWithChildren> = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{ children }</span>;
export default NoBr;
