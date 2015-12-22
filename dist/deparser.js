// Generated by CoffeeScript 1.10.0
(function() {
  var Deparser, _, compact, contains, fail, first, fk, format, fv, indent, keys;

  _ = require('lodash');

  format = require('util').format;

  contains = _.contains;

  keys = _.keys;

  first = _.first;

  compact = function(o) {
    return _.select(_.compact(o), function(p) {
      return _.isString(p) && p.length > 0;
    });
  };

  fk = function(value) {
    return _.first(_.keys(value));
  };

  fv = function(value) {
    return _.first(_.values(value));
  };

  fail = function(msg) {
    throw new Error(msg);
  };

  indent = function(text, count) {
    if (count == null) {
      count = 1;
    }
    return text;
  };

  module.exports = Deparser = (function() {
    Deparser.deparse = function(query) {
      return new Deparser(query).deparseQuery();
    };

    function Deparser(tree) {
      this.tree = tree;
    }

    Deparser.prototype.deparseQuery = function() {
      return (this.tree.map((function(_this) {
        return function(node) {
          return _this.deparse(node);
        };
      })(this))).join("\n\n");
    };

    Deparser.prototype.quote = function(value) {
      if (value == null) {
        return;
      }
      if (_.isArray(value)) {
        return value.map((function(_this) {
          return function(o) {
            return _this.quote(o);
          };
        })(this));
      } else {
        return '"' + value + '"';
      }
    };

    Deparser.prototype.escape = function(literal) {
      return "'" + literal.replace(/'/g, "''") + "'";
    };

    Deparser.prototype.type = function(names, args) {
      var catalog, mods, res, type;
      catalog = names[0], type = names[1];
      mods = function(name, args) {
        if (args != null) {
          return name + '(' + args + ')';
        } else {
          return name;
        }
      };
      if (names[0] === 'char') {
        names[0] = '"char"';
      }
      if (catalog !== 'pg_catalog') {
        return mods(names.join('.'), args);
      }
      res = (function() {
        switch (type) {
          case 'bpchar':
            if (args != null) {
              return 'char';
            } else {
              return 'pg_catalog.bpchar';
            }
            break;
          case 'varchar':
            return 'varchar';
          case 'numeric':
            return 'numeric';
          case 'bool':
            return 'boolean';
          case 'int2':
            return 'smallint';
          case 'int4':
            return 'int';
          case 'int8':
            return 'bigint';
          case 'real':
          case 'float4':
            return 'real';
          case 'float8':
            return 'pg_catalog.float8';
          case 'text':
            return 'pg_catalog.text';
          case 'date':
            return 'pg_catalog.date';
          case 'time':
            return 'time';
          case 'timetz':
            return 'pg_catalog.timetz';
          case 'timestamp':
            return 'timestamp';
          case 'timestamptz':
            return 'pg_catalog.timestamptz';
          case 'interval':
            return 'interval';
          default:
            return fail(format("Can't deparse type: %s", type));
        }
      })();
      return mods(res, args);
    };

    Deparser.prototype.deparse = function(item, context) {
      var node, type;
      if (item == null) {
        return;
      }
      if (_.isNumber(item)) {
        return item;
      }
      type = keys(item)[0];
      node = _.values(item)[0];
      if (this[type] == null) {
        throw new Error(type + " is not implemented");
      }
      return this[type](node, context);
    };

    Deparser.prototype['AEXPR ALL'] = function(node, context) {
      var output;
      output = [];
      output.push(this.deparse(node.lexpr));
      output.push(format('ALL (%s)', this.deparse(node.rexpr)));
      return output.join(' ' + node.name[0] + ' ');
    };

    Deparser.prototype['AEXPR AND'] = function(node, context) {
      return format('(%s) AND (%s)', this.deparse(node.lexpr), this.deparse(node.rexpr));
    };

    Deparser.prototype['AEXPR ANY'] = function(node, context) {
      var output;
      output = [];
      output.push(this.deparse(node.lexpr));
      output.push(format('ANY (%s)', this.deparse(node.rexpr)));
      return output.join(' ' + node.name[0] + ' ');
    };

    Deparser.prototype['AEXPR DISTINCT'] = function(node, context) {
      return format('%s IS DISTINCT FROM %s', this.deparse(node.lexpr), this.deparse(node.rexpr));
    };

    Deparser.prototype['AEXPR IN'] = function(node, context) {
      var operator, rexpr;
      rexpr = node.rexpr.map((function(_this) {
        return function(node) {
          return _this.deparse(node);
        };
      })(this));
      operator = node.name[0] === '=' ? 'IN' : 'NOT IN';
      return format('%s %s (%s)', this.deparse(node.lexpr), operator, rexpr.join(', '));
    };

    Deparser.prototype['AEXPR NOT'] = function(node, context) {
      return format('NOT (%s)', this.deparse(node.rexpr));
    };

    Deparser.prototype['AEXPR NULLIF'] = function(node, context) {
      return format('NULLIF(%s, %s)', this.deparse(node.lexpr), this.deparse(node.rexpr));
    };

    Deparser.prototype['AEXPR OR'] = function(node, context) {
      return format('(%s) OR (%s)', this.deparse(node.lexpr), this.deparse(node.rexpr));
    };

    Deparser.prototype['AEXPR OF'] = function(node) {
      var item, list, op;
      op = node.name[0] === '=' ? 'IS OF' : 'IS NOT OF';
      list = (function() {
        var i, len, ref, results1;
        ref = node.rexpr;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          results1.push(this.deparse(item));
        }
        return results1;
      }).call(this);
      return format('%s %s (%s)', this.deparse(node.lexpr), op, list.join(', '));
    };

    Deparser.prototype['AEXPR'] = function(node, context) {
      var op, output;
      output = [];
      if (node.lexpr) {
        if (node.lexpr.A_CONST != null) {
          output.push(this.deparse(node.lexpr, context || true));
        } else {
          output.push('(' + this.deparse(node.lexpr, context || true) + ')');
        }
      }
      op = _.last(node.name) === '~~' ? 'LIKE' : _.last(node.name);
      if (node.name.length > 1) {
        op = "OPERATOR(" + node.name[0] + "." + op + ")";
      }
      output.push(op);
      if (node.rexpr) {
        if (node.rexpr.A_CONST != null) {
          output.push(this.deparse(node.rexpr, context || true));
        } else {
          output.push('(' + this.deparse(node.rexpr, context || true) + ')');
        }
      }
      if (output.length === 2) {
        output = output.join('');
      } else {
        output = output.join(' ');
      }
      return '(' + output + ')';
    };

    Deparser.prototype['ALIAS'] = function(node, context) {
      var name, output;
      name = node.aliasname;
      output = ['AS'];
      if (node.colnames) {
        output.push(name + '(' + this.quote(node.colnames).join(', ') + ')');
      } else {
        output.push(this.quote(name));
      }
      return output.join(' ');
    };

    Deparser.prototype['A_ARRAYEXPR'] = function(node) {
      var element, list, output;
      output = ['ARRAY['];
      list = [];
      if (node.elements) {
        list = (function() {
          var i, len, ref, results1;
          ref = node.elements;
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            element = ref[i];
            results1.push(this.deparse(element));
          }
          return results1;
        }).call(this);
      }
      output.push(list.join(', '));
      output.push(']');
      return output.join('');
    };

    Deparser.prototype['A_CONST'] = function(node, context) {
      var prefix, value;
      switch (node.type) {
        case 'string':
          return this.escape(node.val);
        case 'integer':
          if (node.val < 0) {
            return '(' + node.val.toString() + ')';
          } else {
            return node.val.toString();
          }
          break;
        case 'float':
          value = node.val.toString();
          if (!(value.indexOf('.') > -1)) {
            value += '.0';
          }
          value;
          if (node.val < 0) {
            return '(' + value + ')';
          } else {
            return value;
          }
          break;
        case 'bitstring':
          return prefix = node.val[0].toUpperCase() + this.escape(node.val.substring(1));
        case 'null':
          return 'NULL';
        default:
          return fail(format("Unrecognized A_CONST value %s: %s", JSON.stringify(node), context));
      }
    };

    Deparser.prototype['A_INDICES'] = function(node) {
      if (node.lidx) {
        return format('[%s:%s]', this.deparse(node.lidx), this.deparse(node.uidx));
      } else {
        return format('[%s]', this.deparse(node.uidx));
      }
    };

    Deparser.prototype['A_INDIRECTION'] = function(node) {
      var i, len, output, parts, ref, subnode, value;
      output = ['(' + this.deparse(node.arg) + ')'];
      parts = [];
      ref = node.indirection;
      for (i = 0, len = ref.length; i < len; i++) {
        subnode = ref[i];
        if (_.isString(subnode) || subnode.A_STAR) {
          value = subnode.A_STAR ? '*' : this.quote(subnode);
          output.push('.' + value);
        } else {
          output.push(this.deparse(subnode));
        }
      }
      return output.join('');
    };

    Deparser.prototype['A_STAR'] = function(node, context) {
      return '*';
    };

    Deparser.prototype['BOOLEANTEST'] = function(node) {
      var output, tests;
      output = [];
      output.push(this.deparse(node.arg));
      tests = ['IS TRUE', 'IS NOT TRUE', 'IS FALSE', 'IS NOT FALSE', 'IS UNKNOWN', 'IS NOT UNKNOWN'];
      output.push(tests[node.booltesttype]);
      return output.join(' ');
    };

    Deparser.prototype['CASE'] = function(node) {
      var arg, i, len, output, ref;
      output = ['CASE'];
      if (node.arg) {
        output.push(this.deparse(node.arg));
      }
      ref = node.args;
      for (i = 0, len = ref.length; i < len; i++) {
        arg = ref[i];
        output.push(this.deparse(arg));
      }
      if (node['defresult']) {
        output.push('ELSE');
        output.push(this.deparse(node.defresult));
      }
      output.push('END');
      return output.join(' ');
    };

    Deparser.prototype['COALESCE'] = function(node) {
      var arg, args, i, len, output, ref;
      output = [];
      args = [];
      ref = node.args;
      for (i = 0, len = ref.length; i < len; i++) {
        arg = ref[i];
        args.push(this.deparse(arg));
      }
      return format('COALESCE(%s)', args.join(', '));
    };

    Deparser.prototype['COLLATECLAUSE'] = function(node) {
      var output;
      output = [];
      if (node.arg != null) {
        output.push(this.deparse(node.arg));
      }
      output.push('COLLATE');
      if (node.collname != null) {
        output.push(this.quote(node.collname));
      }
      return output.join(' ');
    };

    Deparser.prototype['COLUMNDEF'] = function(node) {
      var i, item, len, output, ref;
      output = [this.quote(node.colname)];
      output.push(this.deparse(node.typeName));
      if (node.raw_default) {
        output.push('USING');
        output.push(this.deparse(node.raw_default));
      }
      if (node.constraints) {
        ref = node.constraints;
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          output.push(this.deparse(item));
        }
      }
      return _.compact(output).join(' ');
    };

    Deparser.prototype['COLUMNREF'] = function(node) {
      var fields;
      fields = node.fields.map((function(_this) {
        return function(field) {
          if (_.isString(field)) {
            return _this.quote(field);
          } else {
            return _this.deparse(field);
          }
        };
      })(this));
      return fields.join('.');
    };

    Deparser.prototype['COMMONTABLEEXPR'] = function(node) {
      var output;
      output = [];
      output.push(node.ctename);
      if (node.aliascolnames) {
        output.push(format('(%s)', this.quote(node.aliascolnames)));
      }
      output.push(format('AS (%s)', this.deparse(node.ctequery)));
      return output.join(' ');
    };

    Deparser.prototype['FUNCCALL'] = function(node, context) {
      var call, name, order, output, params, withinGroup;
      output = [];
      params = [];
      if (node.args) {
        params = node.args.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this));
      }
      if (node.agg_star) {
        params.push('*');
      }
      name = node.funcname.join('.');
      order = [];
      withinGroup = node.agg_within_group;
      if (node.agg_order) {
        order.push('ORDER BY');
        order.push((node.agg_order.map((function(_this) {
          return function(node) {
            return _this.deparse(node, context);
          };
        })(this))).join(", "));
      }
      call = [];
      call.push(name + '(');
      if (node.agg_distinct) {
        call.push('DISTINCT ');
      }
      if (node.func_variadic) {
        params[params.length - 1] = 'VARIADIC ' + params[params.length - 1];
      }
      call.push(params.join(', '));
      if (order.length && !withinGroup) {
        call.push(' ');
        call.push(order.join(' '));
      }
      call.push(')');
      output.push(compact(call).join(''));
      if (order.length && withinGroup) {
        output.push('WITHIN GROUP');
        output.push('(' + order.join(' ') + ')');
      }
      if (node.agg_filter != null) {
        output.push(format('FILTER (WHERE %s)', this.deparse(node.agg_filter)));
      }
      if (node.over != null) {
        output.push(format('OVER %s', this.deparse(node.over, 'function')));
      }
      return output.join(' ');
    };

    Deparser.prototype['INTOCLAUSE'] = function(node) {
      var output;
      output = [];
      output.push(this.deparse(node.rel));
      return output.join('');
    };

    Deparser.prototype['JOINEXPR'] = function(node, context) {
      var join, output, ref, wrapped;
      output = [];
      output.push(this.deparse(node.larg));
      if (node.isNatural) {
        output.push('NATURAL');
      }
      join = (function() {
        switch (true) {
          case node.jointype === 0 && (node.quals != null):
            return 'INNER JOIN';
          case node.jointype === 0 && !node.isNatural && (node.quals == null) && (node.usingClause == null):
            return 'CROSS JOIN';
          case node.jointype === 0:
            return 'JOIN';
          case node.jointype === 1:
            return 'LEFT OUTER JOIN';
          case node.jointype === 2:
            return 'FULL OUTER JOIN';
          case node.jointype === 3:
            return 'RIGHT OUTER JOIN';
          default:
            return fail(format('unhandled join type %s', node.jointype));
        }
      })();
      output.push(join);
      if (node.rarg) {
        if ((node.rarg.JOINEXPR != null) && (((ref = node.rarg.JOINEXPR) != null ? ref.alias : void 0) == null)) {
          output.push('(' + this.deparse(node.rarg) + ')');
        } else {
          output.push(this.deparse(node.rarg));
        }
      }
      if (node.quals) {
        output.push("ON " + this.deparse(node.quals));
      }
      if (node.usingClause) {
        output.push("USING (" + this.quote(node.usingClause).join(", ") + ")");
      }
      wrapped = (node.rarg.JOINEXPR != null) || node.alias ? '(' + output.join(' ') + ')' : output.join(' ');
      if (node.alias) {
        return wrapped + ' ' + this.deparse(node.alias);
      } else {
        return wrapped;
      }
    };

    Deparser.prototype['LOCKINGCLAUSE'] = function(node) {
      var output, strengths;
      strengths = ['FOR KEY SHARE', 'FOR SHARE', 'FOR NO KEY UPDATE', 'FOR UPDATE'];
      output = [];
      output.push(strengths[node.strength]);
      if (node.lockedRels) {
        output.push('OF');
        output.push((node.lockedRels.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this))).join(', '));
      }
      return output.join(' ');
    };

    Deparser.prototype['MINMAX'] = function(node) {
      var arg, args, i, len, output, ref;
      output = [];
      if (node.op === 0) {
        output.push('GREATEST');
      } else {
        output.push('LEAST');
      }
      args = [];
      ref = node.args;
      for (i = 0, len = ref.length; i < len; i++) {
        arg = ref[i];
        args.push(this.deparse(arg));
      }
      output.push('(' + args.join(', ') + ')');
      return output.join('');
    };

    Deparser.prototype['NAMEDARGEXPR'] = function(node) {
      var output;
      output = [];
      output.push(node.name);
      output.push(':=');
      output.push(this.deparse(node.arg));
      return output.join(' ');
    };

    Deparser.prototype['NULLTEST'] = function(node) {
      var output;
      output = [this.deparse(node.arg)];
      if (node.nulltesttype === 0) {
        output.push('IS NULL');
      } else if (node.nulltesttype === 1) {
        output.push('IS NOT NULL');
      }
      return output.join(' ');
    };

    Deparser.prototype['RANGEFUNCTION'] = function(node) {
      var call, calls, funcCall, funcs, i, len, output, ref, ref1;
      output = [];
      if (node.lateral) {
        output.push('LATERAL');
      }
      funcs = [];
      ref = node.functions;
      for (i = 0, len = ref.length; i < len; i++) {
        funcCall = ref[i];
        call = [this.deparse(funcCall[0])];
        if ((ref1 = funcCall[1]) != null ? ref1.length : void 0) {
          call.push('AS (' + (funcCall[1].map((function(_this) {
            return function(def) {
              return _this.deparse(def);
            };
          })(this))).join(', ') + ')');
        }
        funcs.push(call.join(' '));
      }
      calls = funcs.join(', ');
      if (node.is_rowsfrom) {
        output.push('ROWS FROM (' + calls + ')');
      } else {
        output.push(calls);
      }
      if (node.ordinality) {
        output.push('WITH ORDINALITY');
      }
      if (node.alias) {
        output.push(this.deparse(node.alias));
      }
      if (node.coldeflist) {
        if (!node.alias) {
          output.push(' AS (' + (node.coldeflist.map((function(_this) {
            return function(col) {
              return _this.deparse(col);
            };
          })(this))).join(", ") + ')');
        } else {
          output.push('(' + (node.coldeflist.map((function(_this) {
            return function(col) {
              return _this.deparse(col);
            };
          })(this))).join(", ") + ')');
        }
      }
      return output.join(' ');
    };

    Deparser.prototype['RANGESUBSELECT'] = function(node, context) {
      var output;
      output = '';
      if (node.lateral) {
        output += 'LATERAL ';
      }
      output += '(' + this.deparse(node.subquery) + ')';
      if (node.alias) {
        return output + ' ' + this.deparse(node.alias);
      } else {
        return output;
      }
    };

    Deparser.prototype['RANGEVAR'] = function(node, context) {
      var output;
      output = [];
      if (node.inhOpt === 0) {
        output.push('ONLY');
      }
      if (node.relpersistence === 'u') {
        output.push('UNLOGGED');
      }
      if (node.relpersistence === 't') {
        output.push('TEMPORARY');
      }
      if (node.schemaname != null) {
        output.push(this.quote(node.schemaname));
        output.push('.');
      }
      output.push(this.quote(node.relname));
      if (node.alias) {
        output.push(this.deparse(node.alias));
      }
      return output.join(' ');
    };

    Deparser.prototype['RESTARGET'] = function(node, context) {
      if (context === 'select') {
        return compact([this.deparse(node.val), this.quote(node.name)]).join(' AS ');
      } else if (context === 'update') {
        return compact([node.name, this.deparse(node.val)]).join(' = ');
      } else if (node.val == null) {
        return this.quote(node.name);
      } else {
        return fail(format("Can't deparse %s in context %s", JSON.stringify(node), context));
      }
    };

    Deparser.prototype['ROW'] = function(node) {
      var args;
      args = node.args || [];
      return 'ROW(' + args.map((function(_this) {
        return function(arg) {
          return _this.deparse(arg);
        };
      })(this)).join(', ') + ')';
    };

    Deparser.prototype['SELECT'] = function(node, context) {
      var i, len, lists, output, ref, sets, w, window, windows;
      output = [];
      if (node.withClause) {
        output.push(this.deparse(node.withClause));
      }
      if (node.op === 0) {
        if (node.valuesLists == null) {
          output.push('SELECT');
        }
      } else {
        output.push('(' + this.deparse(node.larg) + ')');
        sets = ['NONE', 'UNION', 'INTERSECT', 'EXCEPT'];
        output.push(sets[node.op]);
        if (node.all) {
          output.push('ALL');
        }
        output.push('(' + this.deparse(node.rarg) + ')');
      }
      if (node.distinctClause) {
        if (node.distinctClause[0] != null) {
          output.push('DISTINCT ON');
          output.push('(' + indent((node.distinctClause.map((function(_this) {
            return function(node) {
              return _this.deparse(node, 'select');
            };
          })(this))).join(",\n")) + ')');
        } else {
          output.push('DISTINCT');
        }
      }
      if (node.targetList) {
        output.push(indent((node.targetList.map((function(_this) {
          return function(node) {
            return _this.deparse(node, 'select');
          };
        })(this))).join(",\n")));
      }
      if (node.intoClause) {
        output.push("INTO");
        output.push(indent(this.deparse(node.intoClause)));
      }
      if (node.fromClause) {
        output.push("FROM");
        output.push(indent((node.fromClause.map((function(_this) {
          return function(node) {
            return _this.deparse(node, 'from');
          };
        })(this))).join(",\n")));
      }
      if (node.whereClause) {
        output.push("WHERE");
        output.push(indent(this.deparse(node.whereClause)));
      }
      if (node.valuesLists) {
        output.push('VALUES');
        lists = node.valuesLists.map((function(_this) {
          return function(list) {
            return '(' + (list.map(function(v) {
              return _this.deparse(v);
            })).join(', ') + ')';
          };
        })(this));
        output.push(lists.join(', '));
      }
      if (node.groupClause) {
        output.push('GROUP BY');
        output.push(indent((node.groupClause.map((function(_this) {
          return function(node) {
            return _this.deparse(node, 'group');
          };
        })(this))).join(",\n")));
      }
      if (node.havingClause) {
        output.push('HAVING');
        output.push(indent(this.deparse(node.havingClause)));
      }
      if (node.windowClause) {
        output.push('WINDOW');
        windows = [];
        ref = node.windowClause;
        for (i = 0, len = ref.length; i < len; i++) {
          w = ref[i];
          window = [];
          if (w.WINDOWDEF.name) {
            window.push(this.quote(w.WINDOWDEF.name) + ' AS');
          }
          window.push('(' + this.deparse(w, 'window') + ')');
          windows.push(window.join(' '));
        }
        output.push(windows.join(', '));
      }
      if (node.sortClause) {
        output.push('ORDER BY');
        output.push(indent((node.sortClause.map((function(_this) {
          return function(node) {
            return _this.deparse(node, 'sort');
          };
        })(this))).join(",\n")));
      }
      if (node.limitCount) {
        output.push('LIMIT');
        output.push(indent(this.deparse(node.limitCount)));
      }
      if (node.limitOffset) {
        output.push('OFFSET');
        output.push(indent(this.deparse(node.limitOffset)));
      }
      if (node.lockingClause) {
        node.lockingClause.forEach((function(_this) {
          return function(item) {
            return output.push(_this.deparse(item));
          };
        })(this));
      }
      return output.join(" ");
    };

    Deparser.prototype['SORTBY'] = function(node) {
      var output;
      output = [];
      output.push(this.deparse(node.node));
      if (node.sortby_dir === 1) {
        output.push('ASC');
      }
      if (node.sortby_dir === 2) {
        output.push('DESC');
      }
      if (node.sortby_dir === 3) {
        output.push('USING ' + node.useOp);
      }
      if (node.sortby_nulls === 1) {
        output.push('NULLS FIRST');
      }
      if (node.sortby_nulls === 2) {
        output.push('NULLS LAST');
      }
      return output.join(' ');
    };

    Deparser.prototype['SUBLINK'] = function(node) {
      switch (true) {
        case node.subLinkType === 0:
          return format('EXISTS (%s)', this.deparse(node.subselect));
        case node.subLinkType === 1:
          return format('%s %s ALL (%s)', this.deparse(node.testexpr), node.operName[0], this.deparse(node.subselect));
        case node.subLinkType === 2 && node.operName[0] === '=':
          return format('%s IN (%s)', this.deparse(node.testexpr), this.deparse(node.subselect));
        case node.subLinkType === 2:
          return format('%s %s ANY (%s)', this.deparse(node.testexpr), node.operName[0], this.deparse(node.subselect));
        case node.subLinkType === 3:
          return format('%s %s (%s)', this.deparse(node.testexpr), node.operName[0], this.deparse(node.subselect));
        case node.subLinkType === 4:
          return format('(%s)', this.deparse(node.subselect));
        case node.subLinkType === 5:
          return format('ARRAY (%s)', this.deparse(node.subselect));
      }
    };

    Deparser.prototype['TYPECAST'] = function(node) {
      return this.deparse(node.arg) + '::' + this.deparse(node['typeName']);
    };

    Deparser.prototype['TYPENAME'] = function(node) {
      var args, output, type;
      if (_.last(node.names) === 'interval') {
        return this.deparseInterval(node);
      }
      output = [];
      if (node['setof']) {
        output.push('SETOF');
      }
      args = null;
      if (node.typmods != null) {
        args = node.typmods.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this));
      }
      type = [];
      type.push(this.type(node['names'], args != null ? args.join(', ') : void 0));
      if (node.arrayBounds != null) {
        type.push('[]');
      }
      output.push(type.join(''));
      return output.join(' ');
    };

    Deparser.prototype['WHEN'] = function(node) {
      var output;
      output = ['WHEN'];
      output.push(this.deparse(node.expr));
      output.push('THEN');
      output.push(this.deparse(node.result));
      return output.join(' ');
    };

    Deparser.prototype['WINDOWDEF'] = function(node, context) {
      var clause, empty, frameOptions, orders, output, parens, partition, windowParts;
      output = [];
      if (context !== 'window') {
        if (node.name) {
          output.push(node.name);
        }
      }
      empty = (node.partitionClause == null) && (node.orderClause == null);
      frameOptions = this.deparseFrameOptions(node.frameOptions, node.refname, node.startOffset, node.endOffset);
      if (empty && context !== 'window' && (node.name == null) && frameOptions.length === 0) {
        return '()';
      }
      windowParts = [];
      parens = false;
      if (node.partitionClause) {
        partition = ['PARTITION BY'];
        clause = node.partitionClause.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this));
        partition.push(clause.join(', '));
        windowParts.push(partition.join(' '));
        parens = true;
      }
      if (node.orderClause) {
        windowParts.push('ORDER BY');
        orders = node.orderClause.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this));
        windowParts.push(orders.join(', '));
        parens = true;
      }
      if (frameOptions.length) {
        parens = true;
        windowParts.push(frameOptions);
      }
      if (parens && context !== 'window') {
        return output.join(' ') + ' (' + windowParts.join(' ') + ')';
      } else {
        return output.join(' ') + windowParts.join(' ');
      }
    };

    Deparser.prototype['WITHCLAUSE'] = function(node) {
      var cte, ctes, i, len, output, ref;
      output = ['WITH'];
      if (node.recursive) {
        output.push('RECURSIVE');
      }
      ctes = [];
      ref = node.ctes;
      for (i = 0, len = ref.length; i < len; i++) {
        cte = ref[i];
        ctes.push(this.deparse(cte));
      }
      output.push(ctes.join(', '));
      return output.join(' ');
    };

    Deparser.prototype.deparseFrameOptions = function(options, refName, startOffset, endOffset) {
      var FRAMEOPTION_BETWEEN, FRAMEOPTION_END_CURRENT_ROW, FRAMEOPTION_END_UNBOUNDED_FOLLOWING, FRAMEOPTION_END_UNBOUNDED_PRECEDING, FRAMEOPTION_END_VALUE_FOLLOWING, FRAMEOPTION_END_VALUE_PRECEDING, FRAMEOPTION_NONDEFAULT, FRAMEOPTION_RANGE, FRAMEOPTION_ROWS, FRAMEOPTION_START_CURRENT_ROW, FRAMEOPTION_START_UNBOUNDED_FOLLOWING, FRAMEOPTION_START_UNBOUNDED_PRECEDING, FRAMEOPTION_START_VALUE_FOLLOWING, FRAMEOPTION_START_VALUE_PRECEDING, between, output;
      FRAMEOPTION_NONDEFAULT = 0x00001;
      FRAMEOPTION_RANGE = 0x00002;
      FRAMEOPTION_ROWS = 0x00004;
      FRAMEOPTION_BETWEEN = 0x00008;
      FRAMEOPTION_START_UNBOUNDED_PRECEDING = 0x00010;
      FRAMEOPTION_END_UNBOUNDED_PRECEDING = 0x00020;
      FRAMEOPTION_START_UNBOUNDED_FOLLOWING = 0x00040;
      FRAMEOPTION_END_UNBOUNDED_FOLLOWING = 0x00080;
      FRAMEOPTION_START_CURRENT_ROW = 0x00100;
      FRAMEOPTION_END_CURRENT_ROW = 0x00200;
      FRAMEOPTION_START_VALUE_PRECEDING = 0x00400;
      FRAMEOPTION_END_VALUE_PRECEDING = 0x00800;
      FRAMEOPTION_START_VALUE_FOLLOWING = 0x01000;
      FRAMEOPTION_END_VALUE_FOLLOWING = 0x02000;
      if (!(options & FRAMEOPTION_NONDEFAULT)) {
        return '';
      }
      output = [];
      if (refName != null) {
        output.push(refName);
      }
      if (options & FRAMEOPTION_RANGE) {
        output.push('RANGE');
      }
      if (options & FRAMEOPTION_ROWS) {
        output.push('ROWS');
      }
      between = options & FRAMEOPTION_BETWEEN;
      if (between) {
        output.push('BETWEEN');
      }
      if (options & FRAMEOPTION_START_UNBOUNDED_PRECEDING) {
        output.push('UNBOUNDED PRECEDING');
      }
      if (options & FRAMEOPTION_START_UNBOUNDED_FOLLOWING) {
        output.push('UNBOUNDED FOLLOWING');
      }
      if (options & FRAMEOPTION_START_CURRENT_ROW) {
        output.push('CURRENT ROW');
      }
      if (options & FRAMEOPTION_START_VALUE_PRECEDING) {
        output.push(this.deparse(startOffset) + ' PRECEDING');
      }
      if (options & FRAMEOPTION_START_VALUE_FOLLOWING) {
        output.push(this.deparse(startOffset) + ' FOLLOWING');
      }
      if (between) {
        output.push('AND');
        if (options & FRAMEOPTION_END_UNBOUNDED_PRECEDING) {
          output.push('UNBOUNDED PRECEDING');
        }
        if (options & FRAMEOPTION_END_UNBOUNDED_FOLLOWING) {
          output.push('UNBOUNDED FOLLOWING');
        }
        if (options & FRAMEOPTION_END_CURRENT_ROW) {
          output.push('CURRENT ROW');
        }
        if (options & FRAMEOPTION_END_VALUE_PRECEDING) {
          output.push(this.deparse(endOffset) + ' PRECEDING');
        }
        if (options & FRAMEOPTION_END_VALUE_FOLLOWING) {
          output.push(this.deparse(endOffset) + ' FOLLOWING');
        }
      }
      return output.join(' ');
    };

    Deparser.prototype.deparseInterval = function(node) {
      var intervals, ref, ref1, ref2, ref3, type, typmods;
      type = ['interval'];
      if (node.arrayBounds != null) {
        type.push('[]');
      }
      if (node.typmods) {
        typmods = node.typmods.map((function(_this) {
          return function(item) {
            return _this.deparse(item);
          };
        })(this));
        intervals = this.interval(typmods[0]);
        if (((ref = node.typmods[0]) != null ? (ref1 = ref.A_CONST) != null ? ref1.val : void 0 : void 0) === 32767 && (((ref2 = node.typmods[1]) != null ? ref2.A_CONST : void 0) != null)) {
          intervals = ['(' + ((ref3 = node.typmods[1]) != null ? ref3.A_CONST.val : void 0) + ')'];
        } else {
          intervals = intervals.map((function(_this) {
            return function(part) {
              if (part === 'second' && typmods.length === 2) {
                return "second(" + (_.last(typmods)) + ")";
              } else {
                return part;
              }
            };
          })(this));
        }
        type.push(intervals.join(' to '));
      }
      return type.join(' ');
    };

    Deparser.prototype.interval = function(mask) {
      var results;
      if (this.MASKS == null) {
        this.MASKS = {
          0: 'RESERV',
          1: 'MONTH',
          2: 'YEAR',
          3: 'DAY',
          4: 'JULIAN',
          5: 'TZ',
          6: 'DTZ',
          7: 'DYNTZ',
          8: 'IGNORE_DTF',
          9: 'AMPM',
          10: 'HOUR',
          11: 'MINUTE',
          12: 'SECOND',
          13: 'MILLISECOND',
          14: 'MICROSECOND',
          15: 'DOY',
          16: 'DOW',
          17: 'UNITS',
          18: 'ADBC',
          19: 'AGO',
          20: 'ABS_BEFORE',
          21: 'ABS_AFTER',
          22: 'ISODATE',
          23: 'ISOTIME',
          24: 'WEEK',
          25: 'DECADE',
          26: 'CENTURY',
          27: 'MILLENNIUM',
          28: 'DTZMOD'
        };
      }
      if (this.BITS == null) {
        this.BITS = _.invert(this.MASKS);
      }
      results = [];
      if (this.INTERVALS == null) {
        this.INTERVALS = {};
        this.INTERVALS[1 << this.BITS['YEAR']] = ['year'];
        this.INTERVALS[1 << this.BITS['MONTH']] = ['month'];
        this.INTERVALS[1 << this.BITS['DAY']] = ['day'];
        this.INTERVALS[1 << this.BITS['HOUR']] = ['hour'];
        this.INTERVALS[1 << this.BITS['MINUTE']] = ['minute'];
        this.INTERVALS[1 << this.BITS['SECOND']] = ['second'];
        this.INTERVALS[1 << this.BITS['YEAR'] | 1 << this.BITS['MONTH']] = ['year', 'month'];
        this.INTERVALS[1 << this.BITS['DAY'] | 1 << this.BITS['HOUR']] = ['day', 'hour'];
        this.INTERVALS[1 << this.BITS['DAY'] | 1 << this.BITS['HOUR'] | 1 << this.BITS['MINUTE']] = ['day', 'minute'];
        this.INTERVALS[1 << this.BITS['DAY'] | 1 << this.BITS['HOUR'] | 1 << this.BITS['MINUTE'] | 1 << this.BITS['SECOND']] = ['day', 'second'];
        this.INTERVALS[1 << this.BITS['HOUR'] | 1 << this.BITS['MINUTE']] = ['hour', 'minute'];
        this.INTERVALS[1 << this.BITS['HOUR'] | 1 << this.BITS['MINUTE'] | 1 << this.BITS['SECOND']] = ['hour', 'second'];
        this.INTERVALS[1 << this.BITS['MINUTE'] | 1 << this.BITS['SECOND']] = ['minute', 'second'];
        this.INTERVALS[this.INTERVAL_FULL_RANGE = '32767'] = [];
      }
      return this.INTERVALS[mask.toString()];
    };

    return Deparser;

  })();

}).call(this);
