/**
 * Tests for CodeExtractor and related modules
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeExtractor } from '../services/extractors/code-extractor';
import { HtmlParser } from '../services/extractors/parsers/html-parser';
import { MarkdownParser } from '../services/extractors/parsers/markdown-parser';
import { LanguageDetector } from '../services/extractors/language-detector';

// ==================== HTML Parser Tests ====================

describe('HtmlParser', () => {
  let parser: HtmlParser;

  beforeEach(() => {
    parser = new HtmlParser();
  });

  it('should extract code from standard pre>code blocks', async () => {
    const html = `
      <pre><code class="language-javascript">
const greeting = "Hello, World!";
console.log(greeting);
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[0].code).toContain('const greeting');
    expect(snippets[0].source.format).toBe('html');
  });

  it('should extract code from highlight.js formatted blocks', async () => {
    const html = `
      <pre><code class="hljs language-typescript">
interface User {
  id: string;
  name: string;
}
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('typescript');
    expect(snippets[0].code).toContain('interface User');
    expect(snippets[0].source.highlighter).toBe('highlight.js');
  });

  it('should extract code from Prism formatted blocks', async () => {
    const html = `
      <pre class="language-python"><code>
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('python');
    expect(snippets[0].code).toContain('def greet');
    expect(snippets[0].source.highlighter).toBe('prism');
  });

  it('should extract code from GitHub-style highlight blocks', async () => {
    const html = `
      <div class="highlight-source-go">
        <pre>
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
        </pre>
      </div>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('go');
    expect(snippets[0].code).toContain('package main');
    expect(snippets[0].source.highlighter).toBe('github');
  });

  it('should decode HTML entities in code', async () => {
    const html = `
      <pre><code class="language-javascript">
if (a &lt; b &amp;&amp; c &gt; d) {
  console.log(&quot;test&quot;);
}
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].code).toContain('if (a < b && c > d)');
    expect(snippets[0].code).toContain('"test"');
  });

  it('should detect language when not specified', async () => {
    const html = `
      <pre><code>
func main() {
    fmt.Println("Hello, Go!")
}
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('go');
    expect(snippets[0].metadata.confidence).toBeGreaterThan(0);
  });

  it('should handle multiple code blocks', async () => {
    const html = `
      <h2>JavaScript Example</h2>
      <pre><code class="language-javascript">
const x = 1;
const y = 2;
      </code></pre>
      <h2>Python Example</h2>
      <pre><code class="language-python">
x = 1
y = 2
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(2);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[1].language).toBe('python');
  });

  it('should extract context (heading) before code block', async () => {
    const html = `
      <h2>Using React Hooks</h2>
      <p>Here is an example:</p>
      <pre><code class="language-javascript">
const [count, setCount] = useState(0);
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].context?.title).toBe('Using React Hooks');
  });

  it('should handle data-lang attribute', async () => {
    const html = `
      <pre data-lang="rust">
fn main() {
    println!("Hello, Rust!");
}
      </pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('rust');
  });

  it('should calculate line count correctly', async () => {
    const html = `
      <pre><code class="language-javascript">
const a = 1;
const b = 2;
const c = 3;
const d = 4;
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].lineCount).toBe(4);
  });

  it('should detect comments in code', async () => {
    const html = `
      <pre><code class="language-javascript">
// This is a comment
const x = 1;
/* Multi-line
   comment */
const y = 2;
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].metadata.hasComments).toBe(true);
  });

  it('should detect incomplete code (unbalanced brackets)', async () => {
    const html = `
      <pre><code class="language-javascript">
function incomplete() {
  if (true) {
    console.log("missing closing brackets");
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].metadata.isComplete).toBe(false);
  });

  it('should skip empty code blocks', async () => {
    const html = `
      <pre><code class="language-javascript">
      </code></pre>
      <pre><code class="language-python">
print("Hello")
      </code></pre>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('python');
  });

  it('should extract from Dev.to format', async () => {
    const html = `
      <div class="highlight js-code-highlight">
        <pre class="highlight javascript"><code>
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return &lt;button onClick={() => setCount(c => c + 1)}&gt;{count}&lt;/button&gt;;
}
        </code></pre>
      </div>
    `;

    const snippets = await parser.parse(html);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[0].source.highlighter).toBe('devto');
    expect(snippets[0].code).toContain('import { useState }');
    expect(snippets[0].code).toContain('<button onClick');
  });
});

// ==================== Markdown Parser Tests ====================

describe('MarkdownParser', () => {
  let parser: MarkdownParser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  it('should extract code from fenced blocks with language', async () => {
    const markdown = `
# Example

Here is some code:

\`\`\`javascript
const x = 1;
const y = 2;
console.log(x + y);
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[0].code).toContain('const x = 1');
    expect(snippets[0].source.format).toBe('markdown');
  });

  it('should extract code from fenced blocks without language', async () => {
    const markdown = `
\`\`\`
func main() {
    fmt.Println("Hello")
}
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('go');
    expect(snippets[0].metadata.confidence).toBeGreaterThan(0);
  });

  it('should extract code from tilde fences', async () => {
    const markdown = `
~~~python
def hello():
    print("Hello, World!")
~~~
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('python');
    expect(snippets[0].code).toContain('def hello');
  });

  it('should extract code from indented blocks', async () => {
    const markdown = `
# Example

This is an indented code block:

    const x = 1;
    const y = 2;
    console.log(x + y);

End of example.
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].code).toContain('const x = 1');
  });

  it('should handle multiple code blocks', async () => {
    const markdown = `
## JavaScript

\`\`\`javascript
const x = 1;
\`\`\`

## Python

\`\`\`python
x = 1
\`\`\`

## Ruby

\`\`\`ruby
x = 1
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(3);
    expect(snippets[0].language).toBe('javascript');
    expect(snippets[1].language).toBe('python');
    expect(snippets[2].language).toBe('ruby');
  });

  it('should extract heading context', async () => {
    const markdown = `
## Using React Hooks

Here is how to use useState:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].context?.title).toBe('Using React Hooks');
  });

  it('should extract description context', async () => {
    const markdown = `
Here is how to create a function:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].context?.description).toContain('create a function');
  });

  it('should normalize language aliases', async () => {
    const markdown = `
\`\`\`ts
interface User {
  id: string;
}
\`\`\`

\`\`\`py
def hello():
    pass
\`\`\`

\`\`\`sh
echo "hello"
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(3);
    expect(snippets[0].language).toBe('typescript');
    expect(snippets[1].language).toBe('python');
    expect(snippets[2].language).toBe('bash');
  });

  it('should calculate line count correctly', async () => {
    const markdown = `
\`\`\`javascript
line1
line2
line3
line4
line5
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].lineCount).toBe(5);
  });

  it('should handle code with nested backticks', async () => {
    const markdown = `
\`\`\`\`javascript
const template = \`Hello, \${name}!\`;
console.log(template);
\`\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].code).toContain('template');
  });

  it('should skip empty code blocks', async () => {
    const markdown = `
\`\`\`javascript
\`\`\`

\`\`\`python
print("hello")
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(1);
    expect(snippets[0].language).toBe('python');
  });

  it('should parse GitHub README style', async () => {
    const markdown = `
# Installation

\`\`\`bash
npm install my-package
\`\`\`

## Usage

\`\`\`typescript
import { MyClass } from 'my-package';

const instance = new MyClass({
  option1: 'value1',
  option2: true,
});

await instance.run();
\`\`\`
`;

    const snippets = await parser.parse(markdown);

    expect(snippets).toHaveLength(2);
    expect(snippets[0].language).toBe('bash');
    expect(snippets[0].context?.title).toBe('Installation');
    expect(snippets[1].language).toBe('typescript');
    expect(snippets[1].context?.title).toBe('Usage');
  });
});

// ==================== Language Detector Tests ====================

describe('LanguageDetector', () => {
  let detector: LanguageDetector;

  beforeEach(() => {
    detector = new LanguageDetector();
  });

  it('should detect JavaScript', () => {
    const code = `
const greeting = "Hello, World!";
console.log(greeting);

function add(a, b) {
  return a + b;
}

const result = add(1, 2);
`;

    const result = detector.detect(code);

    expect(result.language).toBe('javascript');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect TypeScript', () => {
    const code = `
interface User {
  id: string;
  name: string;
  email?: string;
}

function getUser(id: string): User {
  return { id, name: "John" };
}

type UserRole = "admin" | "user";
`;

    const result = detector.detect(code);

    expect(result.language).toBe('typescript');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Python', () => {
    const code = `
def greet(name):
    return f"Hello, {name}!"

class User:
    def __init__(self, name):
        self.name = name

if __name__ == "__main__":
    print(greet("World"))
`;

    const result = detector.detect(code);

    expect(result.language).toBe('python');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Go', () => {
    const code = `
package main

import "fmt"

func main() {
    message := "Hello, Go!"
    fmt.Println(message)
}
`;

    const result = detector.detect(code);

    expect(result.language).toBe('go');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Rust', () => {
    const code = `
fn main() {
    let mut x = 5;
    println!("The value of x is: {}", x);
    x = 6;
    println!("The value of x is: {}", x);
}

impl MyStruct {
    fn new() -> Self {
        Self {}
    }
}
`;

    const result = detector.detect(code);

    expect(result.language).toBe('rust');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Java', () => {
    const code = `
package com.example;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }

    private String greeting = "Hello";
}
`;

    const result = detector.detect(code);

    expect(result.language).toBe('java');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect SQL', () => {
    const code = `
SELECT u.id, u.name, u.email
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id
ORDER BY u.name;
`;

    const result = detector.detect(code);

    expect(result.language).toBe('sql');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Bash', () => {
    const code = `
#!/bin/bash

echo "Installing dependencies..."

for file in *.txt; do
    echo "Processing $file"
done

if [ -f config.json ]; then
    source ./setup.sh
fi
`;

    const result = detector.detect(code);

    expect(result.language).toBe('bash');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect YAML', () => {
    const code = `
name: my-app
version: 1.0.0

services:
  web:
    image: nginx
    ports:
      - "80:80"
`;

    const result = detector.detect(code);

    expect(result.language).toBe('yaml');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should detect Dockerfile', () => {
    const code = `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`;

    const result = detector.detect(code);

    expect(result.language).toBe('dockerfile');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should return plaintext for unrecognized code', () => {
    const code = `
This is just plain text
without any code patterns
or syntax indicators.
`;

    const result = detector.detect(code);

    expect(result.language).toBe('plaintext');
    expect(result.confidence).toBe(0);
  });

  it('should return list of supported languages', () => {
    const languages = detector.getSupportedLanguages();

    expect(languages).toContain('javascript');
    expect(languages).toContain('typescript');
    expect(languages).toContain('python');
    expect(languages).toContain('go');
    expect(languages).toContain('rust');
    expect(languages).toContain('java');
  });
});

// ==================== CodeExtractor Integration Tests ====================

describe('CodeExtractor', () => {
  let extractor: CodeExtractor;

  beforeEach(() => {
    extractor = new CodeExtractor();
  });

  it('should extract from HTML content', async () => {
    const html = `
      <h2>Example</h2>
      <pre><code class="language-javascript">
const x = 1;
const y = 2;
console.log(x + y);
      </code></pre>
    `;

    const result = await extractor.extract(html);

    expect(result.snippets).toHaveLength(1);
    expect(result.metadata.format).toBe('html');
    expect(result.snippets[0].language).toBe('javascript');
  });

  it('should extract from Markdown content', async () => {
    const markdown = `
# Example

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`
`;

    const result = await extractor.extract(markdown);

    expect(result.snippets).toHaveLength(1);
    expect(result.metadata.format).toBe('markdown');
    expect(result.snippets[0].language).toBe('python');
    expect(result.snippets[0].lineCount).toBe(4);
  });

  it('should extract from mixed content', async () => {
    const mixed = `
# Markdown Section

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

<h2>HTML Section</h2>
<pre><code class="language-python">
def hello():
    print("Hello")
</code></pre>
`;

    const result = await extractor.extract(mixed);

    expect(result.metadata.format).toBe('mixed');
    expect(result.snippets.length).toBeGreaterThanOrEqual(2);
  });

  it('should deduplicate similar snippets', async () => {
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.metadata.duplicatesRemoved).toBe(1);
  });

  it('should not deduplicate when disabled', async () => {
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`
`;

    const extractor = new CodeExtractor({ deduplication: false });
    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(2);
    expect(result.metadata.duplicatesRemoved).toBe(0);
  });

  it('should filter by minimum line count', async () => {
    const content = `
\`\`\`javascript
x = 1
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\`
`;

    const extractor = new CodeExtractor({ minLines: 2 });
    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.snippets[0].lineCount).toBeGreaterThanOrEqual(2);
  });

  it('should filter by maximum line count', async () => {
    const lines = Array(150).fill('const x = 1;').join('\n');
    const content = `
\`\`\`javascript
${lines}
\`\`\`

\`\`\`javascript
const a = 1;
const b = 2;
\`\`\`
`;

    const extractor = new CodeExtractor({ maxLines: 100 });
    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.snippets[0].lineCount).toBeLessThanOrEqual(100);
  });

  it('should detect language when not specified', async () => {
    const content = `
\`\`\`
package main

import "fmt"

func main() {
    message := "Hello, Go!"
    fmt.Println(message)
}
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.snippets[0].language).toBe('go');
    expect(result.snippets[0].metadata.confidence).toBeGreaterThan(0);
  });

  it('should return metadata about extraction', async () => {
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.metadata).toHaveProperty('totalFound');
    expect(result.metadata).toHaveProperty('duplicatesRemoved');
    expect(result.metadata).toHaveProperty('format');
    expect(result.metadata).toHaveProperty('extractedAt');
    expect(result.metadata.extractedAt).toBeInstanceOf(Date);
  });

  it('should sort snippets by position', async () => {
    const content = `
## First Section

\`\`\`javascript
const first = 1;
const second = 2;
\`\`\`

## Second Section

\`\`\`python
first = 1
second = 2
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(2);
    expect(result.snippets[0].context?.position).toBe(1);
    expect(result.snippets[1].context?.position).toBe(2);
  });

  it('should preserve snippet with more context when deduplicating', async () => {
    const content = `
## Important Section

This is an important example:

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.snippets[0].context?.title).toBe('Important Section');
  });

  it('should get current options', () => {
    const extractor = new CodeExtractor({
      minLines: 5,
      maxLines: 50,
    });

    const options = extractor.getOptions();

    expect(options.minLines).toBe(5);
    expect(options.maxLines).toBe(50);
    expect(options.deduplication).toBe(true); // default
    expect(options.similarityThreshold).toBe(0.9); // default
  });

  it('should handle real Dev.to article format', async () => {
    const devtoHtml = `
<h2>Using React Hooks</h2>
<p>Here's how to create a custom hook:</p>
<div class="highlight js-code-highlight">
<pre class="highlight javascript"><code>
import { useState, useEffect } from 'react';

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
</code></pre>
</div>
`;

    const result = await extractor.extract(devtoHtml);

    expect(result.snippets.length).toBeGreaterThanOrEqual(1);
    expect(result.snippets[0].code).toContain('useWindowSize');
  });

  it('should handle empty content', async () => {
    const result = await extractor.extract('');

    expect(result.snippets).toHaveLength(0);
    expect(result.metadata.totalFound).toBe(0);
  });

  it('should handle content without code blocks', async () => {
    const content = `
# Just a heading

This is just plain text without any code blocks.

- Item 1
- Item 2
- Item 3
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(0);
  });

  it('should provide access to language detector', () => {
    const detector = extractor.getLanguageDetector();

    expect(detector).toBeInstanceOf(LanguageDetector);
    expect(detector.getSupportedLanguages()).toContain('javascript');
  });
});

// ==================== Deduplication Tests ====================

describe('Deduplication', () => {
  it('should identify exact duplicates', async () => {
    const extractor = new CodeExtractor({ deduplication: true });
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
    expect(result.metadata.duplicatesRemoved).toBe(1);
  });

  it('should identify near-duplicates (whitespace differences)', async () => {
    const extractor = new CodeExtractor({
      deduplication: true,
      similarityThreshold: 0.8, // Lower threshold to account for whitespace differences
    });
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\`

\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(1);
  });

  it('should keep distinct snippets', async () => {
    const extractor = new CodeExtractor({ deduplication: true });
    const content = `
\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

\`\`\`javascript
function subtract(a, b) {
  return a - b;
}
\`\`\`
`;

    const result = await extractor.extract(content);

    expect(result.snippets).toHaveLength(2);
    expect(result.metadata.duplicatesRemoved).toBe(0);
  });

  it('should respect custom similarity threshold', async () => {
    const extractor = new CodeExtractor({
      deduplication: true,
      similarityThreshold: 0.99, // Very high threshold
    });
    const content = `
\`\`\`javascript
const x = 1;
const y = 2;
const z = 3;
const w = 4;
\`\`\`

\`\`\`javascript
const a = 10;
const b = 20;
const c = 30;
const d = 40;
\`\`\`
`;

    const result = await extractor.extract(content);

    // With 99% threshold, these clearly different snippets should both be kept
    expect(result.snippets).toHaveLength(2);
  });
});
