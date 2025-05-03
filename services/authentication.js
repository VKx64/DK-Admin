import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// Login Function store user credentials in AuthStore
export async function login(email, password) {
  try {
    // Authenticate User with Email and Password
    const authData = await pb
      .collection("users")
      .authWithPassword(email, password);

    // Check if authentication was successful (authData will have record)
    if (authData.record) {
      console.log("Login Successful!");
      console.log("User ID: ", pb.authStore.record.id); // Use model instead of record after auth
      return true;
    } else {
      // This case might not be strictly necessary as authWithPassword throws on failure
      // but kept for robustness
      console.log("Login Failed: Authentication data missing.");
      pb.authStore.clear();
      return false;
    }
  } catch (error) {
    console.error("Login Failed: ", error);
    pb.authStore.clear();
    return false;
  }
}

// Logout Function
export function logout() {
  pb.authStore.clear();
  console.log("User Logged Out Successfully");
  return true;
}