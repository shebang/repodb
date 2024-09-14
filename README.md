# repodb

`repodb` is a little tool to create indices on your local repositories. The tool
runs as a server and updates its data periodically.

repodb-cli is the command line client for executing queries.

## Interface

- Get all repositories that use Lua:

```shell
repodb-cli lang=lua

```

 output

```text
  $HOME/dev/repos/github.com/nvim-lua/plenary.nvim
  $HOME/dev/repos/github.com/luvit/luv
  $HOME/dev/repos/github.com/luvit/luvit
```

- Get all repositories with the topic "neovim":

```shell
repodb-cli topic=neovim

```

 output

```text
  $HOME/dev/repos/github.com/nvim-lua/plenary.nvim
```
