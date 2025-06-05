// ==UserScript==
// @name         百度贴吧模拟 APP 一键签到
// @version      2025-03-07
// @description  百度贴吧模拟 APP 一键签到
// @author       Par9uet
// @match        https://tieba.baidu.com
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tieba.baidu.com
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  "use strict";

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

  const ui = (function () {
    const setStyle = () => {
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
    };

    const createButton = () => {
      const button = document.createElement("button");
      button.classList.add("real-one-key-sign-button");
      button.innerText = "真一键 APP 签到";
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
    };
    /**
     * @description 拿到所有喜欢的吧的列表
     * @returns {Promise<Array<{
     *   user_id: number;
     *   forum_id: number;
     *   forum_name: string;
     *   is_like: number;
     *   is_black: number;
     *   like_num: number;
     *   is_top: number;
     *   in_time: number;
     *   level_id: number;
     *   level_name: string;
     *   cur_score: string;
     *   score_left: string;
     *   sort_value: number;
     *   is_sign: number;
     * }>>}
     */
    const getAllLike = async () => {
      const resp = await fetch("/", {
        method: "GET",
      });
      const html = await resp.text();
      const matchRes = html.match(/like_forum:\s*(?<arrayStr>\[.*?\])/s);
      if (!matchRes) {
        return [];
      }
      const { arrayStr } = matchRes.groups;
      const array = JSON.parse(arrayStr);
      return array;
    };

    /**
     * @description 根据吧名签到
     * @param {string} kw 吧名
     */
    const sign = async (kw) => {
      const sp = new URLSearchParams();
      sp.append("ie", "utf-8");
      sp.append("kw", kw);
      const cookie = document.cookie
        .split(";")
        .map((item) => item.trim().split("="));
      const baiduId = cookie.find((item) => item[0] === "BAIDUID")[1];
      const headers = new Headers();
      headers.append("content-type", "application/json");
      const json = await fetch(
        "https://tieba-sign.prohibitorum.top/tieba_app_sign",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            cookie: `ka=open;BAIDUID=${baiduId}`,
            kw,
            bduss,
            tbs: PageData.tbs,
          }),
        }
      ).then((resp) => resp.json());
      if (json.error_code !== "0") {
        return json.data.errmsg;
      }
      return json.forum[0].window_conf.text;
    };

    return {
      async mount() {
        setStyle();
        const button = createButton();
        console.log("正在检测挂载点");
        let container = document.getElementsByClassName("left-cont-wraper")[0];
        let count = 20;
        while (!container && count > 0) {
          console.log(
            "未检测到挂载点，等待 400ms 后重试，剩余尝试次数",
            --count
          );
          delay(400);
          container = document.getElementsByClassName("left-cont-wraper")[0];
        }
        console.log("已检测到挂载点");
        container.appendChild(button);
      },
    };
  })();

  ui.mount();
})();
