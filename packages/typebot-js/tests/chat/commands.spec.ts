import * as Typebot from "../../src";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("openBubble", () => {
  it("should add the opened bubble", () => {
    expect.assertions(3);
    const { open } = Typebot.initBubble({
      publishId: "typebot-id",
    });
    const bubble = document.getElementById("typebot-bubble") as HTMLDivElement;
    expect(bubble.classList.contains("iframe-opened")).toBe(false);
    open();
    expect(bubble.classList.contains("iframe-opened")).toBe(true);
    expect(open).not.toThrow();
  });

  it("should hide the proactive message", () => {
    expect.assertions(2);
    const { open, openProactiveMessage } = Typebot.initBubble({
      publishId: "typebot-id",
      proactiveMessage: {
        textContent: "Hi click here!",
        avatarUrl: "https://website.com/my-avatar.png",
      },
    });
    const bubble = document.getElementById("typebot-bubble") as HTMLDivElement;
    if (openProactiveMessage) openProactiveMessage();
    expect(bubble.classList.contains("message-opened")).toBe(true);
    open();
    expect(bubble.classList.contains("message-opened")).toBe(false);
  });
});

describe("closeBubble", () => {
  it("should remove the corresponding class", () => {
    expect.assertions(2);
    const { close, open } = Typebot.initBubble({
      publishId: "typebot-id",
    });
    open();
    const bubble = document.getElementById("typebot-bubble") as HTMLDivElement;
    expect(bubble.classList.contains("iframe-opened")).toBe(true);
    close();
    expect(bubble.classList.contains("iframe-opened")).toBe(false);
  });
});

describe("openProactiveMessage", () => {
  it("should add the opened className", () => {
    expect.assertions(1);
    const { openProactiveMessage } = Typebot.initBubble({
      proactiveMessage: {
        textContent: "Hi click here!",
      },
      publishId: "typebot-id",
    });
    const bubble = document.getElementById("typebot-bubble") as HTMLDivElement;
    if (openProactiveMessage) openProactiveMessage();
    expect(bubble.classList.contains("message-opened")).toBe(true);
  });

  it("shouldn't be returned if no message", () => {
    expect.assertions(1);
    const { openProactiveMessage } = Typebot.initBubble({
      publishId: "typebot-id",
    });
    expect(openProactiveMessage).toBeUndefined();
  });
});

describe("Request commands afterwards", () => {
  it("should return defined commands", () => {
    Typebot.initBubble({
      proactiveMessage: {
        textContent: "Hi click here!",
      },
      publishId: "typebot-id",
    });

    const { close, open, openProactiveMessage } = Typebot.getBubbleActions();
    expect(close).toBeDefined();
    expect(open).toBeDefined();
    expect(openProactiveMessage).toBeDefined();
    open();
    const bubble = document.getElementById("typebot-bubble") as HTMLDivElement;
    expect(bubble.classList.contains("iframe-opened")).toBe(true);
  });
});
