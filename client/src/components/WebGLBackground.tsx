import { useEffect, useRef } from "react";

export function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    // Definir tamanho do canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resizeCanvas();

    // Vertex Shader
    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Fragment Shader - Liquid Mesh com Perlin Noise simulado
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;

      // Simulação de ruído Perlin
      float noise(vec2 p) {
        return sin(p.x * 12.9898 + p.y * 78.233) * 43758.5453;
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n0 = noise(i);
        float n1 = noise(i + vec2(1.0, 0.0));
        float n2 = noise(i + vec2(0.0, 1.0));
        float n3 = noise(i + vec2(1.0, 1.0));
        
        float nx0 = mix(n0, n1, f.x);
        float nx1 = mix(n2, n3, f.x);
        return mix(nx0, nx1, f.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = uv * 3.0 + time * 0.1;
        
        // Influência do mouse
        vec2 mouseInfluence = (mouse - uv) * 0.5;
        p += mouseInfluence;
        
        // Múltiplas camadas de ruído
        float n = smoothNoise(p);
        n += 0.5 * smoothNoise(p * 2.0 + time * 0.05);
        n += 0.25 * smoothNoise(p * 4.0 + time * 0.1);
        n = n * 0.5 + 0.5;
        
        // Cores com gradiente
        vec3 color1 = vec3(0.05, 0.15, 0.35); // Azul escuro
        vec3 color2 = vec3(0.1, 0.3, 0.6);   // Azul médio
        vec3 color3 = vec3(0.2, 0.5, 0.8);   // Azul claro
        
        vec3 color = mix(color1, color2, n);
        color = mix(color, color3, smoothstep(0.3, 0.7, n));
        
        // Adicionar brilho perto do mouse
        float dist = distance(uv, mouse);
        color += vec3(0.0, 0.5, 1.0) * 0.3 * exp(-dist * 3.0);
        
        // Efeito de pulso
        color += vec3(sin(time * 0.5) * 0.1);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Compilar shaders
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    // Criar programa
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Criar buffer de posição
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Obter locais de uniforms
    const resolutionLocation = gl.getUniformLocation(program, "resolution");
    const timeLocation = gl.getUniformLocation(program, "time");
    const mouseLocation = gl.getUniformLocation(program, "mouse");

    // Rastrear movimento do mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Loop de renderização
    let startTime = Date.now();
    const render = () => {
      const elapsed = (Date.now() - startTime) * 0.001;

      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 w-full h-full"
      style={{ background: "#0f172a" }}
    />
  );
}
