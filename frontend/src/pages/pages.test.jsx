import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Dashboard } from "./Dashboard";
import { SendMoney } from "./SendMoney";
import { Signin } from "./Signin";
import { mockFetch, renderAt } from "../test/utils";

const ME = { user: { id: "u1", username: "ana@example.com", firstName: "Ana", lastName: "Lopez" }, balance: 1500 };
const BOB_ID = "65f1c0ffee0123456789abce";

describe("Signin", () => {
  it("shows the server error on bad credentials", async () => {
    mockFetch(() => [401, { message: "Invalid email or password" }]);
    renderAt("/signin", [["/signin", <Signin />]]);

    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong-pass");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  it("validates empty fields without calling the API", async () => {
    const fetch = mockFetch(() => [200, {}]);
    renderAt("/signin", [["/signin", <Signin />]]);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("stores the token and redirects on success", async () => {
    mockFetch(() => [200, { token: "jwt", user: ME.user }]);
    renderAt("/signin", [
      ["/signin", <Signin />],
      ["/dashboard", <p>dashboard page</p>],
    ]);
    await userEvent.type(screen.getByLabelText("Email"), "ana@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
    expect(localStorage.getItem("paytm.token")).toBe("jwt");
  });
});

describe("Dashboard", () => {
  it("shows the real balance, other users and an empty activity state", async () => {
    localStorage.setItem("paytm.token", "jwt");
    mockFetch((method, path) => {
      if (path === "/user/me") return [200, ME];
      if (path.startsWith("/user/bulk")) return [200, { users: [{ id: BOB_ID, firstName: "Bob", lastName: "Ray", username: "bob@example.com" }] }];
      if (path.startsWith("/account/transactions")) return [200, { transactions: [] }];
      return [404, {}];
    });
    renderAt("/dashboard", [["/dashboard", <Dashboard />]]);

    expect(await screen.findByText("₹1,500.00")).toBeInTheDocument();
    expect(await screen.findByText("Bob Ray")).toBeInTheDocument();
    expect(await screen.findByText(/No transfers yet/)).toBeInTheDocument();
  });

  it("logs out when the session has expired", async () => {
    localStorage.setItem("paytm.token", "expired");
    mockFetch(() => [401, { message: "Session expired, please sign in again" }]);
    renderAt("/dashboard", [["/dashboard", <Dashboard />]]);
    await waitFor(() => expect(localStorage.getItem("paytm.token")).toBeNull());
  });
});

describe("SendMoney", () => {
  const routes = [["/send", <SendMoney />]];

  async function signedIn(handler) {
    localStorage.setItem("paytm.token", "jwt");
    return mockFetch((method, path, body) => (path === "/user/me" ? [200, ME] : handler(method, path, body)));
  }

  it("blocks amounts above the balance before calling the API", async () => {
    const fetch = await signedIn(() => [500, {}]);
    renderAt(`/send?to=${BOB_ID}&name=Bob%20Ray`, routes);
    await screen.findByText("Available: ₹1,500.00");
    await userEvent.type(screen.getByLabelText("Amount (₹)"), "2000");
    await userEvent.click(screen.getByRole("button", { name: /Pay/ }));
    expect(screen.getByText("Amount is more than your balance")).toBeInTheDocument();
    expect(fetch.mock.calls.filter(([url]) => String(url).includes("/transfer"))).toHaveLength(0);
  });

  it("sends money and shows a receipt with the new balance", async () => {
    const fetch = await signedIn((method, path, body) => {
      expect(body).toEqual({ to: BOB_ID, amount: 250.5, note: "Dinner" });
      return [200, { message: "Transfer successful", transactionId: "tx123", amount: 250.5, balance: 1249.5 }];
    });
    renderAt(`/send?to=${BOB_ID}&name=Bob%20Ray`, routes);
    await screen.findByText("Available: ₹1,500.00");
    await userEvent.type(screen.getByLabelText("Amount (₹)"), "250.50");
    await userEvent.type(screen.getByLabelText("Note (optional)"), "Dinner");
    await userEvent.click(screen.getByRole("button", { name: /Pay/ }));

    expect(await screen.findByText("Sent successfully to Bob Ray")).toBeInTheDocument();
    expect(screen.getByText("New balance: ₹1,249.50")).toBeInTheDocument();
    expect(fetch.mock.calls.filter(([url]) => String(url).includes("/transfer"))).toHaveLength(1);
  });

  it("shows server errors such as insufficient balance", async () => {
    await signedIn(() => [400, { message: "Insufficient balance" }]);
    renderAt(`/send?to=${BOB_ID}&name=Bob`, routes);
    await screen.findByText("Available: ₹1,500.00");
    await userEvent.type(screen.getByLabelText("Amount (₹)"), "10");
    await userEvent.click(screen.getByRole("button", { name: /Pay/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Insufficient balance");
  });

  it("handles a missing recipient instead of crashing", async () => {
    await signedIn(() => [200, {}]);
    renderAt("/send", routes);
    expect(await screen.findByText("No recipient selected")).toBeInTheDocument();
  });
});
