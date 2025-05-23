import { Application, Router } from 'jsr:@oak/oak'
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";

const app = new Application();

const router = new Router();

router.get("/", (ctx) => {
    ctx.response.body = "healthy"
})

router.post("/api", async (ctx) => {
    console.log(ctx.request.hasBody)
    if (!ctx.request.hasBody) {
        ctx.response.status = 400;
        ctx.response.type = "application/json"
        ctx.response.body = { message: "Hello Oak!" }
        return;
    }
    
    const {valid, body} = await verifySignature(ctx.request);

    if (!valid) {
        ctx.response.status = 400;
        ctx.response.type = "application/json";
        ctx.response.body = { message: "Hello, Oak!" };
        return;
    }

    if (body.type == 1) {
      ctx.response.status = 200;
      ctx.response.type = 'application/json';
      ctx.response.body = { type: 1 }
      return;
    }

    if (body.type == 2)  {
        if (body.data.name === 'hello') {
        const { value } = body.data.options.find((option) => option.name === "name");
        
        ctx.response.status = 200;
        ctx.response.type = 'application/json';
        ctx.response.body = {
            type: 4,
            data: {
                content: `Hello, ${value}`
            }
        }
        }

        if (body.data.name === 'checkhealth') {
            try {
            const res = await fetch('https://dev.monkeys.support/healthz');
            const data = await res.json();
            console.log(data);

            ctx.response.status = 200;
            ctx.response.type = 'application/json'
            ctx.response.body = {
                type: 4,
                data: {
                    content: `Status: ${data.status}`
                }
            }
            } catch (err) {
                console.log(err);
                ctx.response.status = 200;
                ctx.response.type = 'application/json';
                ctx.response.body = {
                    type: 4,
                    data: {
                        content: `Status: not healthy`
                    }
                }
            }
        }
    }

    return;
});

function hexToUint8Array(hex: string) {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
  );
}

async function verifySignature(
  request: Request,
): Promise<{ valid: boolean; body: string }> {
  const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519")!;
  const timestamp = request.headers.get("X-Signature-Timestamp")!;
  const body = await request.body.text();
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY),
  );

  return {valid, body: JSON.parse(body)};
}

Deno.cron("Healthcheck cron", { minute: { every: 15 } }, async () => {
    const kv = await Deno.openKv();
    const lastStatus = await kv.get(["last_status"]);

    const url = Deno.env.get("WEBHOOK_URL");
    try {
        const res = await fetch("https://monkeys.support/healthz");
        const data = await res.json();

        if (res.status > 400 || data?.status !== 'healthy') {
            if (lastStatus.value == "unhealthy") {
                return;
            }

            kv.set(["last_status"], "unhealthy");

            fetch(url, {
                method: "POST",
                body: JSON.stringify({"content": "Alert <@&1370882301877293147>. Server not responding"}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        if(lastStatus.value == 'unhealthy') {
            fetch(url, {
                method: "POST",
                body: JSON.stringify({"content": "Alert <@&1370882301877293147>. Server has recovered"}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
        }

        kv.set(["last_status"], "healthy");
    } catch (err) {
        console.error(err);
        if (lastStatus.value == "unhealthy") {
            return;
        }
        kv.set(["last_status"], "unhealthy");

        fetch(url, {
            method: "POST",
            body: JSON.stringify({"content": "Alert <@&1370882301877293147>. Server not responding"}),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }    
})

app.use(router.routes());
app.listen();
