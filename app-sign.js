// ==UserScript==
// @name         百度贴吧模拟 APP 一键签到
// @version      2025-12-05
// @description  百度贴吧模拟 APP 一键签到
// @author       Par9uet
// @match        https://tieba.baidu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tieba.baidu.com
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

  // 默认新版 UI
  const isNewPc = !document.cookie.includes("TIEBA_NEW_PC=0");

  /**
   * @description 请通过 f12 打开控制台面板手动将 BDUSS cookie 的值放到此处，由于 cookie 为 httponly，无法从代码中得到。
   */
  const bduss = "";

  /**
   * @description 手动延迟
   * @param {number} ms 透传给 setTimeout 的第二个参数
   * @returns {Promise<void>}
   */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * @description 拿到所有喜欢的吧的列表
   * @returns {Promise<Array<{
   *  forum_id: number;
   *  forum_name: string;
   *  user_level: number;
   *  user_exp: number;
   *  need_exp: number;
   *  is_sign_in: number;
   *  cont_sign_num: number;
   *  avatar: string;
   *  is_official_forum: number;
   *  user_level_name: string;
   * }>>}
   */
  const getAllLike = async () => {
    const headers = new Headers();
    headers.append("content-type", "application/json");
    const json = await fetch(
      "https://tieba-sign.prohibitorum.top/tieba_app_get_forum_list",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          bduss,
        }),
      }
    ).then((resp) => resp.json());
    if (json.error && json.error.errno !== 0) {
      return json.error.errmsg;
    }
    return json.forum_info;
  };

  /**
   * @description 根据吧名签到
   * @param {string} kw 吧名
   */
  const sign = async (kw) => {
    const headers = new Headers();
    headers.append("content-type", "application/json");
    const json = await fetch(
      "https://tieba-sign.prohibitorum.top/tieba_app_sign",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          kw,
          bduss,
        }),
      }
    ).then((resp) => resp.json());
    if (json.error_code !== "0") {
      return json.data.errmsg;
    }
    return json.forum[0].window_conf.text;
  };

  class BaseUI {
    mount() {}
    createButton(tagName = "button") {
      const button = document.createElement(tagName);
      button.innerText = "一键 APP 签到";
      button.addEventListener("click", async () => {
        const allLike = await getAllLike();
        button.disabled = true;
        for (const item of allLike) {
          if (item.is_sign === 0) {
            button.innerText = `正在签到 ${item.forum_name}`;
            const message = await sign(item.forum_name);
            button.innerText = message;
            await delay(200);
          } else {
            button.innerText = `已签到 ${item.forum_name}`;
            await delay(200);
          }
        }
        button.disabled = false;
        button.innerText = "签到已完成，2s 后即将刷新页面";
        await delay(2000);
        unsafeWindow.location.reload();
      });
      return button;
    }
  }

  class OldUI extends BaseUI {
    setStyle() {
      const style = document.createElement("style");
      style.innerText = `
        .left-cont-wraper {
          position: relative;
        }

        .left-cont-wraper .real-one-key-sign-button {
          position: absolute;
          top: 0;
          right: 40px;
          transform: translate(20px, -100%);
          appearance: none;
          background-color: #eee;
          border: 1px solid #333;
        }
      `;
      document.head.appendChild(style);
    }
    mount() {
      this.setStyle();
      const button = this.createButton();
      button.classList.add("real-one-key-sign-button");
      console.log("正在检测挂载点");
      let container = document.getElementsByClassName("left-cont-wraper")[0];
      let count = 20;
      while (!container && count > 0) {
        console.log("未检测到挂载点，等待 400ms 后重试，剩余尝试次数", --count);
        delay(400);
        container = document.getElementsByClassName("left-cont-wraper")[0];
      }
      console.log("已检测到挂载点");
      container.appendChild(button);
    }
  }

  class NewUI extends BaseUI {
    setStyle() {
      const style = document.createElement("style");
      style.innerText = `
        .real-one-key-sign-button {
          background: transparent;
          border-radius: 6px;
          padding: 0 12px;
          cursor: pointer;
          margin-left: 10px;
          height: 38px;
          line-height: 38px;
          white-space: nowrap;
        }

        .real-one-key-sign-button:hover {
          background: #ededf0;
        }
      `;
      document.head.appendChild(style);
    }
    mount() {
      this.setStyle();
      const button = this.createButton("div");
      button.classList.add("menu-item");
      button.classList.add("real-one-key-sign-button");
      console.log("正在检测挂载点");
      let container = document.querySelector(
        ".top-nav-bar .right-menu .menu-list"
      );
      let count = 20;
      while (!container && count > 0) {
        console.log("未检测到挂载点，等待 400ms 后重试，剩余尝试次数", --count);
        delay(400);
        container = document.querySelector(
          ".top-nav-bar .right-menu .menu-list"
        );
      }
      console.log("已检测到挂载点");
      container.appendChild(button);
    }
  }

  if (isNewPc) {
    console.log("检测到新版贴吧 UI");
  } else {
    console.log("检测到旧版贴吧 UI");
  }

  const ui = isNewPc ? new NewUI() : new OldUI();

  ui.mount();
})();
