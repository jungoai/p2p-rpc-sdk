## Build

```bash
npm run build
```

## Run

If it's first node:

Change config appropriately:
```bash
nvim ./examples/n1.yaml
```
Then run:
```bash
node dist/main.js ./examples/n1.yaml
```

If it's not first node:

Change config appropriately:

```bash
nvim ./examples/n2.yaml
```

Run nodes:

```bash
node dist/main.js ./examples/n2.yaml
```
