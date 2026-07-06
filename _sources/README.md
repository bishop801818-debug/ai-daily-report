# Excel 源文件存档

本目录存放所有数据库的原始 Excel 文件，按月存档。

每次 `import_all.py` 运行成功后，会自动将本次使用的 Excel 文件复制到本目录并提交。

回滚：如 Excel 被覆盖，可通过 `git checkout _sources/文件名.xlsx` 恢复任意历史版本。
