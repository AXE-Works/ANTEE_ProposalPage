/**
 * ANTEE 사이트 문의 폼 → 이메일 발송
 *
 * 배포: 웹 앱 / 실행 사용자 "나" / 액세스 권한 "모든 사용자"
 * 발송 계정은 배포한 계정이며, 받는 곳은 TO 입니다.
 * 코드를 고친 뒤에는 "배포 관리 → 수정 → 새 버전"으로 다시 배포해야 반영됩니다(URL은 유지).
 */
const TO = "jewook@axeworks.xyz";
const SENDER_NAME = "ANTEE";
const MAX_SUBJECT = 200;
const MAX_BODY = 5000;
const COOLDOWN_SEC = 30; // 같은 연락처로 연속 전송 방지

function doPost(e) {
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // 봇이 채우는 숨은 칸. 값이 있으면 성공처럼 응답하고 보내지 않는다
    if (p.hp) return json_({ ok: true });

    const contact = str_(p.contact, 200);
    const body = str_(p.body, MAX_BODY);
    // 헤더 인젝션 방지: 제목의 줄바꿈 제거
    const subject =
      str_(p.subject, MAX_SUBJECT).replace(/[\r\n]+/g, " ") || "[ANTEE] 문의";

    if (!contact || !body) return json_({ ok: false, error: "invalid" });

    const cache = CacheService.getScriptCache();
    const key =
      "c_" +
      Utilities.base64EncodeWebSafe(
        Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, contact),
      );
    if (cache.get(key)) return json_({ ok: false, error: "too_many" });
    cache.put(key, "1", COOLDOWN_SEC);

    const mail = { to: TO, subject: subject, body: body, name: SENDER_NAME };
    // 연락처가 이메일이면 답장이 바로 문의자에게 가도록 한다
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) mail.replyTo = contact;

    MailApp.sendEmail(mail);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  }
}

// 배포 URL을 브라우저로 열어 살아 있는지 확인하는 용도
function doGet() {
  return json_({ ok: true, service: "antee-inquiry" });
}

function str_(v, max) {
  return String(v == null ? "" : v)
    .trim()
    .slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** 편집기에서 한 번 실행해 메일 권한(MailApp)을 승인하고 발송을 시험한다 */
function testSend() {
  const res = doPost({
    postData: {
      contents: JSON.stringify({
        mode: "ask",
        subject: "[ANTEE] 테스트",
        contact: TO,
        body: "테스트 발송입니다.",
      }),
    },
  });
  console.log(res.getContent());
}
