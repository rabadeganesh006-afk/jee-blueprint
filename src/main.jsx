import React from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import JeeBlueprint from "./App.jsx";

Amplify.configure(outputs);

function AuthLockedApp() {
  return (
    <Authenticator loginMechanisms={["email"]} signUpAttributes={[]}> 
      {({ signOut, user }) => (
        <div>
          <div style={{
            maxWidth: 420,
            margin: "12px auto 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            fontFamily: "Inter, sans-serif",
            color: "#14233B"
          }}>
            <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Signed in: {user?.signInDetails?.loginId || user?.username || "student"}
            </span>
            <button
              onClick={signOut}
              style={{
                border: "1px solid #D7E3EC",
                background: "white",
                borderRadius: 8,
                padding: "7px 10px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Sign out
            </button>
          </div>
          <JeeBlueprint />
        </div>
      )}
    </Authenticator>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthLockedApp />
  </React.StrictMode>
);
