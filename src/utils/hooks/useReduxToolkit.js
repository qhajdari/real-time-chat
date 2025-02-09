import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { customActions } from "store";

export const useReduxToolkit = (selector, initValue) => {
  const dispatch = useDispatch();
  const selectedState = useSelector((state) => state.custom[selector]);

  const setStateAndDispatch = (newState) => {
    dispatch(customActions.customReducer({ selector, newState }));
  };

  useEffect(() => {
    initValue && setStateAndDispatch(initValue);
  }, []);

  return [selectedState, setStateAndDispatch];
};
