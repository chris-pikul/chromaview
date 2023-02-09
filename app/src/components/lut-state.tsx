import { useState, useCallback, useEffect } from 'react';
import Processor from '../processor';

import type { MutableRefObject } from 'react';

function noOp() {};

export interface LUTStateProps {
  processorRef:MutableRefObject<Processor|null>;
};

export default function LUTState({
  processorRef,
}:LUTStateProps) {
  const [ isLoading, setLoading ] = useState<boolean>(false);
  const [ hasFailed, setFailed ] = useState<boolean>(false);

  const handleLoading = useCallback(() => {
    setLoading(true);
    setFailed(false);

    console.info('LUT is loading');
  }, []);

  const handleFailed = useCallback(() => {
    setLoading(false);
    setFailed(true);

    console.info('LUT failed to load');
  }, []);

  const handleSuccess = useCallback(() => {
    setLoading(false);
    setFailed(false);

    console.info('LUT loading succeeded');
  }, []);

  useEffect(() => {
    // Bind the callbacks
    if(processorRef.current) {
      processorRef.current.onLUTLoading = handleLoading;
      processorRef.current.onLUTFailed = handleFailed;
      processorRef.current.onLUTSuccess = handleSuccess;

      console.info('Bound callbacks to LUT loading');
    }

    // Cleanup so we don't have stale component state in the processor
    return () => {
      if(processorRef.current) {
        processorRef.current.onLUTLoading = noOp;
        processorRef.current.onLUTFailed = noOp;
        processorRef.current.onLUTSuccess = noOp;

        console.info('Cleared callbacks for LUT loading');
      }
    };
  }, [ processorRef.current ]);

  if(isLoading) {
    return <div id='camera-loading' />
  } else if(hasFailed) {
    return <div id='camera-error'>
      <h3>Oops! An Error Occured</h3>
      <p>Looks like something went wrong trying to load the filter. Check your internet connection and try again.</p>
    </div>
  }

  return null;
}