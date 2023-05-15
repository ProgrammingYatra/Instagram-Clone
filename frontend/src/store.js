import { configureStore } from "@reduxjs/toolkit";
import { userReducers } from "./Reducers/User";

const store = configureStore( {
  reducer: {
    user:userReducers
  },
});

export default store;
