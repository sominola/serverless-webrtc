import { useEffect, useRef, useState } from "react";

function App() {
  const [connectionState, setConnectionState] = useState<string>("");
  const [iceConnectionState, setIceConnectionState] = useState<string>("");
  const [createdOffer, setCreatedOffer] = useState<string>("");
  const [remoteOffer, setRemoteOffer] = useState<string>("");
  const [createdAnswer, setCreatedAnswer] = useState<string>("");
  const [remoteAnswer, setRemoteAnswer] = useState<string>("");
  const [text, setText] = useState<string>("");
  const channel = useRef<RTCDataChannel | null>(null);
  const connection = useRef<RTCPeerConnection | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    Init();
  }, []);

  async function Init() {
    connection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun4.l.google.com:19302" }],
    });

    connection.current.ondatachannel = (event) => {
      // console.log("ondatachannel");
      channel.current = event.channel;
      // channel.onopen = (event) => console.log("onopen", event);
      // channel.onmessage = (event) => console.log("onmessage", event);
      channel.current.onmessage = (event) => {
        const message = `Remote message: ${event.data}`;
        setMessages((messages) => [...messages, message]);
      };
    };

    connection.current.onconnectionstatechange = (event) =>
      setConnectionState(connection.current!.connectionState.toString());
    connection.current.oniceconnectionstatechange = (event) =>
      setIceConnectionState(connection.current!.iceConnectionState.toString());
  }

  async function step_1_initiator_create_offer() {
    channel.current = connection.current!.createDataChannel("data");
    // channel.onopen = event => console.log('onopen', event)
    // channel.onmessage = event => console.log('onmessage', event)
    channel.current.onmessage = (event) => {
      console.log("new message");
      const message = `Remote message: ${event.data}`;
      setMessages((messages) => [...messages, message]);
    };

    connection.current!.onicecandidate = (event) => {
      // console.log('onicecandidate', event)
      if (!event.candidate) {
        setCreatedOffer(JSON.stringify(connection.current!.localDescription));
      }
    };

    const offer = await connection.current!.createOffer();
    await connection.current!.setLocalDescription(offer);
  }

  async function step_2_accept_remote_offer() {
    const offer = JSON.parse(remoteOffer!);
    await connection.current!.setRemoteDescription(offer);
  }

  async function step_3_create_answer() {
    connection.current!.onicecandidate = (event) => {
      // console.log('onicecandidate', event)
      if (!event.candidate) {
        setCreatedAnswer(JSON.stringify(connection.current!.localDescription));
      }
    };

    const answer = await connection.current!.createAnswer();
    await connection.current!.setLocalDescription(answer);
  }

  async function step_4_accept_answer() {
    const answer = JSON.parse(remoteAnswer!);
    await connection.current!.setRemoteDescription(answer);
  }

  async function send_text() {
    const message = `Local message: ${text}`;
    setMessages((messages) => [...messages, message]);
    channel.current!.send(text!);
  }

  return (
    <div>
      <table width="100%" border={1}>
        <thead>
          <tr>
            <th>#</th>
            <th>initiator</th>
            <th>peer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>step 1</td>
            <td>
              <input
                type="button"
                value="create offer"
                onClick={step_1_initiator_create_offer}
              />
              <input value={createdOffer!} type="text" readOnly />
            </td>
            <td></td>
          </tr>
          <tr>
            <td>step 2</td>
            <td></td>
            <td>
              <input
                value={remoteOffer!}
                type="text"
                placeholder="offer from initiator"
                onChange={(e) => setRemoteOffer(e.target.value)}
              />
              <input
                type="button"
                value="accept offer"
                onClick={step_2_accept_remote_offer}
              />
            </td>
          </tr>
          <tr>
            <td>step 3</td>
            <td></td>
            <td>
              <input
                type="button"
                value="create answer"
                onClick={step_3_create_answer}
              />
              <input value={createdAnswer!} type="text" readOnly />
            </td>
          </tr>
          <tr>
            <td>step 4</td>
            <td>
              <input
                value={remoteAnswer!}
                type="text"
                placeholder="answer from peer"
                onChange={(e) => setRemoteAnswer(e.target.value)}
              />
              <input
                type="button"
                value="accept answer"
                onClick={step_4_accept_answer}
              />
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <hr />
      <input type="text" onChange={(e) => setText(e.target.value)} />
      <button onClick={send_text}>Send</button>
      <hr />
      <table border={1}>
        <tbody>
          <tr>
            <th colSpan={2}>connection</th>
          </tr>
          <tr>
            <th>connectionState</th>
            <td id="connectionState">{connectionState}</td>
          </tr>
          <tr>
            <th>iceConnectionState</th>
            <td id="iceConnectionState">{iceConnectionState}</td>
          </tr>
        </tbody>
      </table>
      <hr />
      <div>
        <div>
          <div>
            <div>Messages</div>
          </div>
          {messages.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
