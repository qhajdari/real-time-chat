import { render, screen } from "utils/jest/test-utils";
import ResetPassword from "./ResetPassword";

describe("Reset password component", () => {
  test("render without error", async () => {
    render(<ResetPassword />);

    expect(screen.getByText("Login"))?.toBeInTheDocument();
  });
});
