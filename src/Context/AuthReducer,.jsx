const AuthReducer = (state, action) => {

    switch (action.type) {
      case "LOGIN": {
        return {
          currentUser: action.payload,
        };
      }
      case "LOGOUT": {
        return {
          currentUser: null,
        };
      }
      default:
        return state;
    }
  };
  
  export default AuthReducer;

// const initState ={}

// const authReducer = (state = initState, action) => {
//   return state
// }

// export default authReducer