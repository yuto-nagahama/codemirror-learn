import { Form } from "@remix-run/react";

export default function Picker() {
  return (
    <Form method="POST" replace>
      <button type="submit" className="btn btn-sm">
        picker
      </button>
    </Form>
  );
}
