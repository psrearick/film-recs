---
paths:
    - 'tests/**'
---

# Tests

## Suppress unrelated side effects with a file-level beforeEach fake

Overrides the testing-best-practices skill's "fakes go inside each test" rule for one case: when a fake only suppresses a side effect the file's tests don't assert (e.g. UpdateAttributeAffinities dispatched by the Rating observer), put it in a file-level `beforeEach()`, always passing the job/event class names. Fakes a test asserts against still go inside that test, created after setup so earlier dispatches aren't recorded (calling `Queue::fake()` again resets the fake).
