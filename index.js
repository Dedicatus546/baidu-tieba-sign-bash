const cookie = ``;
const baseUrl = "https://tieba.baidu.com/";

/**
 * @description 手动延迟
 * @param {number} ms 透传给 setTimeout 的第二个参数
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @description 请求封装
 * @param {string} method 请求方法
 * @param {string} path 请求路径
 * @param {Record<string, any>} params url 参数
 * @param {any} body body 参数
 * @returns {Promise<Response>}
 */
const request = async (method, path, params = {}, body) => {
  const url = new URL(path, baseUrl);
  Object.keys(params).forEach((key) => {
    url.searchParams.append(key, params[key]);
  });
  const headers = new Headers();
  headers.append(
    "content-type",
    "application/x-www-form-urlencoded; charset=UTF-8"
  );
  headers.append("cookie", cookie);
  headers.append(
    "user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
  );
  const resp = await fetch(url.toString(), {
    method,
    body,
    headers,
  });
  return resp;
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
  const resp = await request("GET", "");
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
  console.log("body", sp.toString());
  const json = await (
    await request("POST", "sign/add", {}, sp.toString())
  ).json();
  if (json.no === 0) {
    console.log(json.data.errmsg);
  } else {
    console.log(json.error);
  }
};

const main = async () => {
  const list = await getAllLike();
  console.log("贴吧总数", list.length);
  console.log(
    "贴吧名称",
    list.map((item) => item.forum_name)
  );
  for (const item of list) {
    console.log("准备签到", item.forum_name);
    if (item.is_sign) {
      console.log("已签到过了");
      continue;
    }
    try {
      await sign(item.forum_name);
      await delay(1000);
    } catch (e) {
      console.error(e);
    }
  }
};

main();
